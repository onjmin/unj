import type { Socket } from "socket.io";
import * as v from "valibot";
import { ReadThreadSchema } from "../../common/request/schema.js";
import Token from "../mylib/token.js";

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
			// await getPost(result.data);
			socket.emit(api, { ok: true });
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});
};
