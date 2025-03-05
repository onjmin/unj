import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { likeSchema } from "../../common/request/schema.js";
import Auth from "../mylib/auth.js";
import { getThreadRoom } from "../mylib/socket.js";
import Token from "../mylib/token.js";

const api = "like";
const delimiter = "###";
const done: Set<string> = new Set();
const good_counts: Map<string, number> = new Map();
const bad_counts: Map<string, number> = new Map();

let id: NodeJS.Timeout;
const delay = 1000 * 60 * 8;
const lazyUpdate = () => {
	clearTimeout(id);
	id = setTimeout(() => {
		// DB書き込み
	}, delay);
};

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const like = v.safeParse(likeSchema, data);
		if (!like.success) {
			return;
		}
		const { token } = like.output;
		const { thread_id, good } = like.output;
		const auth = Auth.get(socket);
		const key = [auth, thread_id].join(delimiter);

		// token検証
		if (!Token.isValid(socket, token)) {
			return;
		}

		// 追加検証
		if (done.has(key)) {
			return;
		}
		done.add(key);

		Token.lock(socket);
		Token.update(socket);

		// 危険な処理
		try {
			let good_count: number;
			let bad_count: number;
			if (good_counts.has(key)) {
				good_count = good_counts.get(key) ?? 0;
				bad_count = bad_counts.get(key) ?? 0;
			} else {
				// await getThread(result.data);
				good_count = 334;
				bad_count = 187;
			}
			if (good) {
				good_counts.set(key, ++good_count);
			} else {
				bad_counts.set(key, ++bad_count);
			}
			io.to(getThreadRoom(thread_id)).emit(api, {
				ok: true,
				good_count,
				bad_count,
			});
			lazyUpdate();
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});
};
