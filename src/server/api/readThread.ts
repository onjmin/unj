import type { Socket } from "socket.io";
import * as v from "valibot";
import { ReadThreadSchema } from "../../common/request/schema.js";
import type { Res, Thread } from "../../common/response/schema.js";
import { encodeThreadId, encodeUserId } from "../mylib/anti-debug.js";
import Token from "../mylib/token.js";
import { bad_counts, good_counts } from "./like.js";
import { lol_counts } from "./lol.js";

const api = "readThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const readThread = v.safeParse(ReadThreadSchema, data);
		if (!readThread.success) {
			return;
		}
		const { token } = readThread.output;
		const { cursor, size, desc } = readThread.output;
		const { thread_id } = readThread.output;

		// token検証
		if (!Token.isValid(socket, token)) {
			return;
		}
		Token.lock(socket);
		Token.update(socket);

		// 危険な処理
		try {
			// await getThread(result.data)
			// await getPost(result.data);
			if (!lol_counts.has(thread_id)) {
				lol_counts.set(thread_id, 810);
				good_counts.set(thread_id, 114);
				bad_counts.set(thread_id, 514);
			}
			const lol_count = lol_counts.get(thread_id) ?? 0;
			const good_count = good_counts.get(thread_id) ?? 0;
			const bad_count = bad_counts.get(thread_id) ?? 0;
			socket.emit(api, {
				ok: true,
				thread: mock,
			});
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});

	const mock2: Res = {
		num: 1,
		created_at: new Date(),
		cc_user_id: encodeUserId("1234"),
		cc_user_name: "月沈めば名無し",
		cc_user_avatar: 0,
		content: "草",
		content_url: "https://i.imgur.com/7dzm3JU.jpeg",
		content_type: 8,
	};

	const mock: Thread = {
		id: encodeThreadId("12345678"),
		latest_res_at: new Date(),
		res_count: 256,
		title: "【朗報】侍ジャパン、謎のホームランで勝利！",
		user_id: encodeUserId("1234"),
		lol_count: 3,
		good_count: 4,
		bad_count: 5,
		res_list: [...Array(64)].map((v, i) =>
			Object.assign(
				{ ...mock2 },
				{
					num: i + 1,
					content_url:
						Math.random() > 0.3
							? "https://i.imgur.com/7dzm3JU.jpeg"
							: "https://youtu.be/3-kI9rDwQ8E",
				},
			),
		),
		deleted_at: new Date(+new Date() + 1000 * 60 * 64),
		ref_thread_id: encodeThreadId("12345678"),
		ps: "追記",
		res_limit: 1000,
		age_res_num: 0,
		sage: false,
		thread_type: 0,
		cc_type: 1,
		content_types_bitmask: 1,
		banned: false,
		subbed: false,
	};
};
