import { differenceInMinutes } from "date-fns";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { HeadlineSchema } from "../../common/request/schema.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import { encodeThreadId, encodeUserId } from "../mylib/anti-debug.js";
import Nonce from "../mylib/nonce.js";
import { sizeOf } from "../mylib/socket.js";

const api = "headline";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const headline = v.safeParse(HeadlineSchema, data);
		if (!headline.success) {
			return;
		}
		const { cursor, size, desc } = headline.output;

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, headline.output.nonce)) {
			return;
		}
		Nonce.lock(socket);
		Nonce.update(socket);

		// 危険な処理
		try {
			// await getPost(_.data);
			socket.emit(api, {
				ok: true,
				list: [...Array(16)].map((v) => mock),
			});
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});

	const mock: HeadlineThread = {
		id: encodeThreadId(9800),
		latestResAt: new Date(),
		resCount: 256,
		title: "【朗報】侍ジャパン、謎のホームランで勝利！",
		userId: encodeUserId(334, new Date()).slice(0, 4),
		online: sizeOf(io, encodeThreadId(9800)),
		ikioi:
			(256 / 60) *
			differenceInMinutes(new Date(), new Date(+new Date() - 9000000)), // レス数 × (60 / 経過時間[分])
		lolCount: 3,
		goodCount: 4,
		badCount: 5,
	};
};
