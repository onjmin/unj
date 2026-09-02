import type { PoolClient } from "@neondatabase/serverless";
import type { Server } from "socket.io";
import { boardIdMap } from "../../common/request/board.js";
import { Enum } from "../../common/request/content-schema.js";
import type { HeadlineThread, Meta } from "../../common/response/schema.js";
import { encodeThreadId } from "./anti-debug.js";
import {
	ccBitmaskCache,
	contentTypesBitmaskCache,
	nextThreadIdCache,
	psCache,
	resCountCache,
	resLimitCache,
	titleCache,
} from "./cache.js";
import { genTestIP } from "./ip.js";
import { logger } from "./log.js";
import { pool } from "./pool.js";
import { broadcastLimit, getHeadlineRoom, getThreadRoom } from "./socket.js";

const SYSTEM_USER_ID = 1; // システムに使っていい実在のusers.id（admin/thread/*と同じ）

// 同一プロセス内での同時多発ガード。権威はDB側（next_thread_idをFOR UPDATEで確認）で、
// これは無駄なDBラウンドトリップを削るだけの高速パス。
const creating: Set<number> = new Set();

/** 「スレタイ (2)」→「スレタイ (3)」…と番号を振る。無ければ (2) を付ける。THREAD_TITLEのmaxLength(32)に収める。 */
function nextTitle(title: string): string {
	const m = title.match(/^(.*) \((\d+)\)$/);
	const base = m ? m[1] : title || "無題";
	const n = m ? Number(m[2]) + 1 : 2;
	const suffix = ` (${n})`;
	return `${base.slice(0, Math.max(0, 32 - suffix.length))}${suffix}`;
}

/** スレのURL。VITE_BASE_URLが未設定の環境（テスト等）では相対パスにフォールバックする。 */
function threadUrl(boardKey: string, encodedId: string): string {
	const base = String(process.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");
	return `${base}/${boardKey}/thread/${encodedId}`;
}

/**
 * res投稿がres_limit=1000のスレで1000/1001レス目に達したとき、自動で次スレを立てて
 * 誘導する（2chの「次スレ」文化の自動版）。api/res.ts（人間）・admin/thread/res.ts
 * （bot等）の両方から、投稿トランザクションのCOMMIT後に呼ぶ。
 *
 * - 旧スレ: ps（>>1の末尾追記。!add相当）に次スレへのリンクを追記し、
 *   next_thread_id を新スレのidで埋める。
 * - 新スレ: 本文（>>1）に前スレへのリンクを埋め込んだ状態で作成する。
 *
 * 呼び出し元は既にCOMMIT済みのため、ここで失敗しても投稿自体は失われない
 * （例外は握りつぶしてログにのみ残す）。
 */
export async function maybeSpawnNextThread({
	threadId,
	resCount,
	io,
}: {
	threadId: number;
	resCount: number;
	io: Server;
}): Promise<string | null> {
	if (resCount !== 1000 && resCount !== 1001) return null;
	if ((nextThreadIdCache.get(threadId) ?? 0) > 0) {
		return encodeThreadId(nextThreadIdCache.get(threadId) ?? 0);
	}
	if (creating.has(threadId)) return null; // 同時多発ガード
	if ((resLimitCache.get(threadId) ?? 0) !== 1000) return null; // res_limitを個別変更したスレは対象外

	creating.add(threadId);
	let poolClient: PoolClient | null = null;
	try {
		poolClient = await pool.connect();
		await poolClient.query("BEGIN");

		// 権威はDB。FOR UPDATEで行ロックし、二重生成を確実に防ぐ。
		const { rows } = await poolClient.query(
			"SELECT next_thread_id, title, board_id, content_types_bitmask, cc_bitmask FROM threads WHERE id = $1 FOR UPDATE",
			[threadId],
		);
		if (rows.length === 0) {
			await poolClient.query("ROLLBACK");
			return null;
		}
		const old = rows[0];
		if (old.next_thread_id) {
			nextThreadIdCache.set(threadId, old.next_thread_id);
			await poolClient.query("ROLLBACK");
			return encodeThreadId(old.next_thread_id);
		}

		const board = boardIdMap.get(old.board_id);
		if (!board) {
			await poolClient.query("ROLLBACK");
			return null;
		}

		const title = nextTitle(old.title ?? "");
		const oldEncodedId = encodeThreadId(threadId) ?? "";
		const prevLink = threadUrl(board.key, oldEncodedId);
		const contentTypesBitmask = old.content_types_bitmask ?? 1;
		// 前スレの設定を引き継ぐ。ここを固定値1にすると、前スレでコテハン・
		// アイコンを許可していても次スレから急にコテ禁・アイコン禁止になる
		// （content_types_bitmaskだけ引き継いでcc_bitmaskを引き継がないのは
		// 単なる漏れ）。
		const ccBitmask = old.cc_bitmask ?? 1;

		const { rows: newRows, rowCount } = await poolClient.query(
			[
				`INSERT INTO threads (${[
					"user_id",
					"cc_user_id",
					"cc_user_name",
					"cc_user_avatar",
					"content_text",
					"content_url",
					"content_type",
					"content_data_url",
					"title",
					"board_id",
					"cc_bitmask",
					"content_types_bitmask",
					"res_limit",
					"latest_res",
					"ip",
					"origin_type",
				].join(",")})`,
				"VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
				"RETURNING id, created_at",
			].join(" "),
			[
				SYSTEM_USER_ID,
				"",
				"次スレ誘導",
				0,
				`前スレ: ${prevLink}`,
				"",
				Enum.Text,
				"",
				title,
				board.id,
				ccBitmask,
				contentTypesBitmask,
				1000,
				`前スレ: ${prevLink}`,
				genTestIP(),
				"fal_1_3",
			],
		);
		if (rowCount === 0) {
			await poolClient.query("ROLLBACK");
			return null;
		}
		const newId: number = newRows[0].id;
		const newEncodedId = encodeThreadId(newId) ?? "";
		const nextLink = threadUrl(board.key, newEncodedId);
		const ps = `次スレ: ${nextLink}`;

		await poolClient.query(
			"UPDATE threads SET next_thread_id = $1, ps = $2 WHERE id = $3",
			[newId, ps, threadId],
		);

		await poolClient.query("COMMIT");

		// キャッシュへ反映（新スレはadmin/thread/make.tsと同じく即書き込み可能にする）
		nextThreadIdCache.set(threadId, newId);
		nextThreadIdCache.set(newId, 0);
		psCache.set(threadId, ps);
		resCountCache.set(newId, 1);
		resLimitCache.set(newId, 1000);
		contentTypesBitmaskCache.set(newId, contentTypesBitmask);
		ccBitmaskCache.set(newId, ccBitmask);
		titleCache.set(newId, title);

		// 旧スレ閲覧者へps更新を通知
		const meta: Meta = {
			varsan: false,
			sage: false,
			ccBitmask: ccBitmaskCache.get(threadId) ?? 1,
			contentTypesBitmask,
			ps,
			ageResNum: 0,
			ageRes: null,
			balsResNum: 0,
		};
		io.to(getThreadRoom(threadId)).emit("updateMeta", { ok: true, new: meta });

		// ヘッドラインへ新スレを通知
		const newHeadline: HeadlineThread = {
			ccUserId: "",
			id: newEncodedId,
			latestRes: `前スレ: ${prevLink}`,
			latestResAt: new Date(),
			resCount: 1,
			title,
			contentText: `前スレ: ${prevLink}`,
			boardId: board.id,
			online: 0,
			ikioi: 0,
			lolCount: 0,
			goodCount: 0,
			badCount: 0,
		};
		if (io.sockets.sockets.size >= broadcastLimit) {
			io.to(getHeadlineRoom(board.id)).emit("newHeadline", {
				ok: true,
				new: newHeadline,
				yours: false,
			});
		} else {
			io.emit("newHeadline", { ok: true, new: newHeadline, yours: false });
		}

		logger.verbose(`nextThread ${threadId} -> ${newId}`);
		return newEncodedId;
	} catch (e) {
		await poolClient?.query("ROLLBACK");
		logger.error(e);
		return null;
	} finally {
		poolClient?.release();
		creating.delete(threadId);
	}
}
