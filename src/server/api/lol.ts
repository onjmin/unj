import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { lolSchema } from "../../common/request/schema.js";
import Auth from "../mylib/auth.js";
import { getThreadRoom } from "../mylib/socket.js";
import Token from "../mylib/token.js";

const api = "lol";
const delimiter = "###";
const done: Set<string> = new Set();
const lol_counts: Map<string, number> = new Map();

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
		const lol = v.safeParse(lolSchema, data);
		if (!lol.success) {
			return;
		}
		const { token } = lol.output;
		const { thread_id } = lol.output;
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
			let lol_count: number;
			if (lol_counts.has(key)) {
				lol_count = lol_counts.get(key) ?? 0;
			} else {
				// await getThread(result.data);
				lol_count = 810;
			}
			lol_counts.set(key, ++lol_count);
			io.to(getThreadRoom(thread_id)).emit(api, {
				ok: true,
				lol_count,
			});
			lazyUpdate();
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});
};
