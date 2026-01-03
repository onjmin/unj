import type { PoolClient } from "@neondatabase/serverless";
import { addHours } from "date-fns";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { boardIdMap, noharaBoard } from "../../common/request/board.js";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { MakeThreadSchema, myConfig } from "../../common/request/schema.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import { encodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { isSameSimhash } from "../mylib/simhash.js";
import { broadcastLimit, getHeadlineRoom } from "../mylib/socket.js";
import { TokenBucket } from "../mylib/token-bucket.js";

const api = "makeThread";
export const tokenBucket = new TokenBucket({
	capacity: 1, // burstなし
	refillRate: 1 / 120, // 120秒で1回復
	costPerAction: 1,
});

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const makeThread = v.safeParse(MakeThreadSchema, data, myConfig);
		if (!makeThread.success) return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, makeThread.output.nonce)) {
			logger.verbose(`🔒 ${makeThread.output.nonce}`);
			return;
		}

		const { ccBitmask, contentTypesBitmask, contentType } = makeThread.output;
		if ((contentTypesBitmask & contentType) === 0) return;
		const schema = contentSchemaMap.get(contentType);
		if (!schema) return;
		const content = v.safeParse(schema, data, myConfig);
		if (!content.success) return;

		const board = boardIdMap.get(makeThread.output.boardId);
		if (!board) return;
		if (!board.avatarMap.has(makeThread.output.userAvatar)) return;

		const userId = auth.getUserId(socket);

		// cc
		const ccUserId = makeCcUserId({
			ccBitmask,
			userId,
			boardId: board.id,
			socket,
		});
		const ccUserName = makeCcUserName({
			ccBitmask,
			userName: makeThread.output.userName,
			socket,
			ninja: false,
		});
		const ccUserAvatar = makeCcUserAvatar({
			ccBitmask,
			userAvatar: makeThread.output.userAvatar,
		});

		// simhashチェック
		if (isSameSimhash(content.output.contentText, userId)) return;

		// レートリミット
		if (!tokenBucket.attempt(userId)) {
			logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds(userId).toFixed(1)}`);
			return;
		}

		let deletedAt: Date | null = null;
		if (makeThread.output.timer) {
			deletedAt = addHours(new Date(), makeThread.output.timer);
		}
		// 強制自動削除（板固有機能）
		if (board.id === noharaBoard.id) {
			deletedAt = addHours(new Date(), 3);
		}

		// 危険な処理
		let poolClient: PoolClient | null = null;
		try {
			nonce.lock(socket);
			nonce.update(socket);

			poolClient = await pool.connect();

			await poolClient.query("BEGIN"); // トランザクション開始

			const latestRes = content.output.contentText || content.output.contentUrl;

			// スレッドの作成
			const { rows, rowCount } = await poolClient.query(
				[
					`INSERT INTO threads (${[
						// 書き込み内容
						"user_id",
						"cc_user_id",
						"cc_user_name",
						"cc_user_avatar",
						"content_text",
						"content_url",
						"content_type",
						// 基本的な情報
						"title",
						"board_id",
						// 高度な設定
						"varsan",
						"sage",
						"cc_bitmask",
						"content_types_bitmask",
						"res_limit",
						"deleted_at",
						// メタ情報
						"latest_res",
						"ip",
					].join(",")})`,
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)",
					"RETURNING *",
				].join(" "),
				[
					// 書き込み内容
					userId,
					ccUserId,
					ccUserName,
					ccUserAvatar,
					content.output.contentText,
					content.output.contentUrl,
					content.output.contentType,
					// 基本的な情報
					makeThread.output.title,
					board.id,
					// 高度な設定
					makeThread.output.varsan,
					makeThread.output.sage,
					makeThread.output.ccBitmask,
					makeThread.output.contentTypesBitmask,
					makeThread.output.max,
					deletedAt,
					// メタ情報
					latestRes,
					getIP(socket),
				],
			);
			if (rowCount === 0) return;
			const { id } = rows[0];

			const newThread: HeadlineThread = {
				// 書き込み内容
				ccUserId,
				// メタ情報
				id: encodeThreadId(id) ?? "",
				latestRes,
				latestResAt: new Date(),
				resCount: 1,
				// 基本的な情報
				title: makeThread.output.title,
				boardId: board.id,
				// 動的なデータ
				online: 1,
				ikioi: 0,
				lolCount: 0,
				goodCount: 0,
				badCount: 0,
			};
			nonce.unlock(socket); // スレ立て直後のreadThreadを成功させるための特別措置
			socket.emit(api, {
				ok: true,
				new: newThread,
				yours: true,
				nonceKey: nonce.getUnsafe(socket), // スレ立て直後のreadThreadを成功させるための特別措置
			});

			// ヘッドラインの更新を全体通知
			if (io.sockets.sockets.size >= broadcastLimit) {
				socket
					.to(getHeadlineRoom(board.id))
					.emit("newHeadline", { ok: true, new: newThread, yours: false });
			} else {
				io.emit("newHeadline", {
					ok: true,
					new: newThread,
					yours: false,
				});
			}

			await poolClient.query("COMMIT"); // 問題なければコミット
			logger.verbose(api);
		} catch (error) {
			await poolClient?.query("ROLLBACK"); // エラーが発生した場合はロールバック
			logger.error(error);
		} finally {
			poolClient?.release();
			nonce.unlock(socket);
		}
	});
};
