import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { SMALLSERIAL, lolSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import Auth from "../mylib/auth.js";
import Nonce from "../mylib/nonce.js";
import { getThreadRoom } from "../mylib/socket.js";

const api = "lol";
const delimiter = "###";
const done: Set<string> = new Set();
export const lolCounts: Map<number, number> = new Map();

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

		// フロントエンド上のスレッドIDを復号する
		const smallserial = v.safeParse(
			SMALLSERIAL,
			decodeThreadId(lol.output.threadId),
		);
		if (!smallserial.success) {
			return;
		}
		const id = smallserial.output;

		const auth = Auth.get(socket);
		const key = [auth, id].join(delimiter);

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, lol.output.nonce)) {
			return;
		}

		// 追加検証
		if (done.has(key)) {
			return;
		}
		done.add(key);

		Nonce.lock(socket);
		Nonce.update(socket);

		// 危険な処理
		try {
			let lolCount = lolCounts.get(id) ?? 0;
			lolCounts.set(id, ++lolCount);
			io.to(getThreadRoom(id)).emit(api, {
				ok: true,
				lolCount,
			});
			lazyUpdate();
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});
};
