import type { PoolClient } from "@neondatabase/serverless";
import type { Request, Response, Router } from "express";
import type { Server } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../../common/request/content-schema.js";
import {
	myConfig,
	SMALLINT,
	THREAD_ID,
	USER_NAME,
} from "../../../common/request/schema.js";
import type { Res } from "../../../common/response/schema.js";
import { decodeThreadId, encodeThreadId } from "../../mylib/anti-debug.js";
import {
	balsResNumCache,
	contentTypesBitmaskCache,
	deletedAtCache,
	isDeleted,
	isMax,
	nextThreadIdCache,
	resCountCache,
	resLimitCache,
} from "../../mylib/cache.js";
import { genTestIP } from "../../mylib/ip.js";
import { logger } from "../../mylib/log.js";
import { maybeSpawnNextThread } from "../../mylib/next-thread.js";
import { pool } from "../../mylib/pool.js";
import { exist, getThreadRoom } from "../../mylib/socket.js";

const api = "/thread/res";
const userId = 1; // システムに使っていい実在のusers.id

const requestSchema = v.strictObject({
	threadId: THREAD_ID,
	ccUserId: v.string(),
	ccUserName: USER_NAME,
	ccUserAvatar: SMALLINT,
	contentText: v.string(), // この段階では簡易的にしか見ない
	contentUrl: v.string(), // この段階では簡易的にしか見ない
	contentData: v.string(), // この段階では簡易的にしか見ない
	contentType: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
});

/**
 * スレのキャッシュが空なら1回だけDBから引いて温める。存在しなければfalse。
 *
 * admin APIはreadThreadを経由しないため、サーバー再起動やデプロイの直後は
 * 各キャッシュが空のままになる。isMax()は resCount(??0) >= resLimit(??0) を
 * 見るので、空だと 0>=0 が真、つまり「1000レス到達で埋まった」と誤判定して
 * 全ての投稿を弾く。人間の閲覧はreadThreadを通るので勝手に温まるが、
 * bot連携はこのAPIしか叩かないため、デプロイの度に投稿できなくなる。
 */
async function ensureThreadCache(threadId: number): Promise<boolean> {
	if (resLimitCache.get(threadId) !== undefined) return true;
	const { rows } = await pool.query(
		[
			"SELECT res_count, res_limit, deleted_at, bals_res_num,",
			"content_types_bitmask, next_thread_id",
			"FROM threads WHERE id = $1",
		].join(" "),
		[threadId],
	);
	if (rows.length === 0) return false;
	const t = rows[0];
	resCountCache.set(threadId, t.res_count);
	resLimitCache.set(threadId, t.res_limit);
	deletedAtCache.set(threadId, t.deleted_at);
	balsResNumCache.set(threadId, t.bals_res_num);
	contentTypesBitmaskCache.set(threadId, t.content_types_bitmask);
	nextThreadIdCache.set(threadId, t.next_thread_id ?? 0);
	return true;
}

export default (router: Router, io: Server) => {
	// unj-relay.ts（onj-minecraft）等が、人間の新着発言だけをポーリングで拾うための口。
	// bot自身の発言（POST /thread/res。user_id=システムのuserId固定）は
	// user_id != $3 で除外し、エコー（中継→また中継対象）を防ぐ。
	router.get(api, async (req: Request, res: Response) => {
		const threadId = decodeThreadId(String(req.query.threadId ?? ""));
		if (!threadId) {
			res.status(400).json({ error: "Invalid threadId" });
			return;
		}
		const sinceNum = Number(req.query.sinceNum ?? 0);
		if (!Number.isInteger(sinceNum) || sinceNum < 0) {
			res.status(400).json({ error: "Invalid sinceNum" });
			return;
		}

		try {
			const { rows } = await pool.query(
				"SELECT num, cc_user_name, content_text FROM res WHERE thread_id = $1 AND num > $2 AND user_id != $3 ORDER BY num LIMIT 50",
				[threadId, sinceNum, userId],
			);
			res.status(200).json({
				message: "ok",
				list: rows.map((r) => ({
					num: r.num,
					ccUserName: r.cc_user_name,
					contentText: r.content_text,
				})),
			});
		} catch (e) {
			logger.error(e);
			res.status(500).json({ error: "Failed to fetch responses" });
		}
	});

	router.post(api, async (req: Request, res: Response) => {
		// レスAPI用バリデーション
		const result = v.safeParse(requestSchema, req.body, myConfig);
		if (!result.success) {
			res.status(400).json({ error: "Invalid threadId" });
			return;
		}

		const threadId = decodeThreadId(result.output.threadId);
		if (!threadId) {
			res.status(400).json({ error: "Invalid threadId" });
			return;
		}

		// キャッシュが冷えていたらDBから温める（冷えたままだとisMax()が誤判定する）。
		if (!(await ensureThreadCache(threadId))) {
			res.status(404).json({ error: "Thread not found" });
			return;
		}

		// 「このスレにはもう書けない」系は必ず応答を返す。
		//
		// res.status()を呼ばずreturnするとレスポンスが返らず、呼び出し元は
		// タイムアウトまで待たされた末に「通信失敗」と区別がつかなくなる。
		// bot連携（onj-minecraftのunj-bridge.ts）は埋まったスレから次スレへ
		// 移る判断をこの応答に頼るため、理由をreasonで機械的に読める形で返す。
		if (isDeleted(threadId)) {
			res.status(410).json({ error: "Thread is deleted", reason: "deleted" });
			return;
		}
		if (balsResNumCache.get(threadId)) {
			res.status(409).json({ error: "Thread is closed", reason: "bals" });
			return;
		}
		if (isMax(threadId, false)) {
			// 既に次スレがあるなら教える（自分の投稿が1000レス目にならなくても、
			// 他人が埋めた場合はこれが唯一の乗り換え手段になる）。
			const nextId = nextThreadIdCache.get(threadId) ?? 0;
			res.status(409).json({
				error: "Thread is full",
				reason: "max",
				nextThreadId: nextId > 0 ? encodeThreadId(nextId) : null,
			});
			return;
		}

		const contentTypesBitmask = contentTypesBitmaskCache.get(threadId) ?? 0;
		if ((contentTypesBitmask & result.output.contentType) === 0) {
			res.status(400).json({ error: "Invalid contentType" });
			return;
		}
		const schema = contentSchemaMap.get(result.output.contentType);
		if (!schema) {
			res.status(400).json({ error: "Invalid contentType" });
			return;
		}
		const content = v.safeParse(schema, req.body, myConfig);
		if (!content.success) {
			res.status(400).json({ error: v.flatten(content.issues) });
			return;
		}

		let poolClient: PoolClient | null = null;
		try {
			poolClient = await pool.connect();
			await poolClient.query("BEGIN");

			const sage = true;

			// レス

			const insertQuery = [
				`INSERT INTO res (${[
					"thread_id",
					"user_id",
					"cc_user_id",
					"cc_user_name",
					"cc_user_avatar",
					"content_text",
					"content_url",
					"content_type",
					"content_data_url",
					"sage",
					"ip",
					// numは最後のVALUES（MAX(num)+1のサブクエリ）に対応する。
					// ここに書き忘れるとカラム11個・値12個になり、
					// "INSERT has more expressions than target columns" で必ず落ちる。
					"num",
				].join(", ")})`,
				"VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,",
				"(SELECT COALESCE(MAX(num), 1) + 1 FROM res WHERE thread_id = $1)",
				")",
				"RETURNING *",
			].join(" ");

			const { rows, rowCount } = await poolClient.query(insertQuery, [
				threadId,
				userId,
				result.output.ccUserId,
				result.output.ccUserName,
				result.output.ccUserAvatar,
				content.output.contentText,
				content.output.contentUrl,
				content.output.contentType,
				content.output.contentData ?? "",
				sage,
				genTestIP(),
			]);
			if (rowCount === 0) {
				// BEGIN後なので、開きっぱなしのままreleaseしないよう巻き戻してから返す
				// （レスポンスを返さずreturnするとリクエストがタイムアウトまでぶら下がる）
				await poolClient.query("ROLLBACK");
				res.status(500).json({ error: "Failed to create response" });
				return;
			}
			const { created_at, num } = rows[0];

			const latestResNum = num;
			resCountCache.set(threadId, latestResNum);

			// スレッドの更新

			const query = new Map();
			query.set("res_count", num);
			await poolClient.query(
				[
					`UPDATE threads SET ${sage ? "" : "latest_res_at = NOW(),"}`,
					[...query.keys()].map((v, i) => `${v}=$${i + 1}`).join(","),
					`WHERE id = $${query.size + 1}`,
				].join(" "),
				[...query.values(), threadId],
			);

			await poolClient.query("COMMIT");

			// 次スレ誘導（1000/1001レス目到達時のみ動く。失敗してもこの投稿は失われない）
			const nextThreadId = await maybeSpawnNextThread({
				threadId,
				resCount: latestResNum,
				io,
			});

			const newRes: Res = {
				yours: true,
				// 書き込み内容
				ccUserId: result.output.ccUserId,
				ccUserName: result.output.ccUserName,
				ccUserAvatar: result.output.ccUserAvatar,
				contentText: content.output.contentText,
				contentUrl: content.output.contentUrl,
				contentType: content.output.contentType,
				contentData: content.output.contentData ?? "",
				animFrames: null,
				animFps: null,
				walkPreset: null,
				commandResult: "",
				// メタ情報
				num: latestResNum,
				createdAt: created_at,
				isOwner: false,
				sage: true,
				parentNum: null,
			};

			// Socket.IO通知
			const threadRoom = getThreadRoom(threadId);
			if (exist(io, threadRoom)) {
				io.to(threadRoom).emit("res", {
					ok: true,
					new: newRes,
					yours: false,
				});
			}

			res.status(200).json({
				message: "Response created successfully",
				res: newRes,
				// 1000/1001レス目でnext-thread.tsが次スレを立てた場合のみ入る。
				// 呼び出し元（bot連携等）はこれが来たらこのthreadIdを使い続けず、
				// 以後はnextThreadIdへ投稿を切り替えること。
				nextThreadId,
			});
		} catch (e) {
			await poolClient?.query("ROLLBACK");
			logger.error(e);
			res.status(500).json({ error: "Failed to create response" });
		} finally {
			poolClient?.release();
		}
	});
};
