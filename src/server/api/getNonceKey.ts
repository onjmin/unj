import type { Socket } from "socket.io";
import * as v from "valibot";
import { getNonceKeySchema } from "../../common/request/schema.js";
import nonce from "../mylib/nonce.js";

const api = "getNonceKey";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const getNonceKey = v.safeParse(getNonceKeySchema, data);
		if (!getNonceKey.success) {
			return;
		}
		socket.emit(api, { ok: true, nonceKey: nonce.get(socket) });
	});
};
