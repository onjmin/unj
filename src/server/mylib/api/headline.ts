import { differenceInMinutes } from "date-fns";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { HeadlineSchema } from "../../../common/request/schema.js";
import { encodeThreadId, encodeUserId } from "../anti-debug.js";
import { count } from "../socket.js";
import Token from "../token.js";

const api = "headline";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const headline = v.safeParse(HeadlineSchema, data);
		if (!headline.success) {
			return;
		}
		const { token } = headline.output;
		const { cursor, size, desc } = headline.output;
		try {
			if (!Token.isValid(socket, token)) {
				return;
			}
			Token.lock(socket);
			Token.update(socket);
			// await getPost(_.data);
			socket.emit(api, {
				ok: true,
				list: [...Array(16)].map((v) => mock),
			});
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});

	const mock = {
		id: encodeThreadId("12345678"),
		latest_res_at: new Date(),
		res_count: 256,
		title: "【朗報】侍ジャパン、謎のホームランで勝利！",
		user_id: encodeUserId("1234"),
		online: count(io, encodeThreadId("12345678")),
		ikioi:
			(256 / 60) *
			differenceInMinutes(new Date(), new Date(+new Date() - 9000000)), // レス数 × (60 / 経過時間[分])
		lol_count: 3,
		good_count: 4,
		bad_count: 5,
	};
};
