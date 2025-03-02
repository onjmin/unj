import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { getTokenSchema } from "../../../common/request/schema.js";
import Token from "../token.js";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on("getToken", async (data) => {
		const getToken = v.safeParse(getTokenSchema, data);
		if (!getToken.success) {
			return;
		}
		socket.emit("getToken", { ok: true, token: Token.get(socket) });
	});
};
