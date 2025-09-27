import type { PoolClient } from "@neondatabase/serverless";
import { addHours, addSeconds, isBefore } from "date-fns";
import type { Socket } from "socket.io";
import * as v from "valibot";
import { boardIdMap } from "../../common/request/board.js";
import {
	contentSchemaMap,
	oekakiSchema,
} from "../../common/request/content-schema.js";
import { MakeThreadSchema, myConfig } from "../../common/request/schema.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import { randInt } from "../../common/util.js";
import { encodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { PROD_MODE } from "../mylib/env.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { isSameSimhash } from "../mylib/simhash.js";
import { headlineRoom } from "../mylib/socket.js";

const api = "makeThread";
export const coolTimes: Map<number, Date> = new Map();

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		// 共通のバリデーション
		const makeThread = v.safeParse(MakeThreadSchema, data, myConfig);
		if (!makeThread.success) return;
		const { ccBitmask, contentTypesBitmask, contentType } = makeThread.output;
		if ((contentTypesBitmask & contentType) === 0) return;
		const schema = contentSchemaMap.get(contentType);
		if (!schema) return;
		const content = v.safeParse(schema, data, myConfig);
		if (!content.success) return;

		const board = boardIdMap.get(makeThread.output.board);
		if (!board) return;
		if (!board.avatarMap.has(makeThread.output.userAvatar)) return;

		if (schema === oekakiSchema) {
			const oekaki = v.safeParse(oekakiSchema, data, myConfig);
			if (!oekaki.success) return;
			const { link, id, deletehash } = oekaki.output.contentMeta;
			logger.info(`🎨 ${link} ${id} ${deletehash}`);
		}

		const userId = auth.getUserId(socket);

		// cc
		const ccUserId = makeCcUserId({
			ccBitmask,
			userId,
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

		// レートリミット
		if (isBefore(new Date(), coolTimes.get(userId) ?? 0)) {
			logger.verbose(`⌛ ${coolTimes.get(userId)}`);
			return;
		}

		let deletedAt: Date | null = null;
		if (makeThread.output.timer) {
			deletedAt = addHours(new Date(), makeThread.output.timer);
		}

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, makeThread.output.nonce)) {
			logger.verbose(`🔒 ${makeThread.output.nonce}`);
			return;
		}

		// simhashチェック
		if (isSameSimhash(content.output.contentText, userId)) return;

		// 危険な処理
		let poolClient: PoolClient | null = null;
		try {
			nonce.lock(socket);
			nonce.update(socket);

			poolClient = await pool.connect();

			if (PROD_MODE)
				coolTimes.set(userId, addSeconds(new Date(), randInt(0, 16)));

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
						"board",
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

			// ヘッドライン更新
			socket
				.to(headlineRoom)
				.emit("newHeadline", { ok: true, new: newThread, yours: false });

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
