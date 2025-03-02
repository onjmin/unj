import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinThreadSchema } from "../../../common/request/schema.js";
import { getThreadRoom, switchRoom } from "../socket.js";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on("joinThread", async (data) => {
		const joinThread = v.safeParse(joinThreadSchema, data);
		if (!joinThread.success) {
			return;
		}
		const { thread_id } = joinThread.output;
		const threadRoom = getThreadRoom(thread_id);
		if (await switchRoom(socket, threadRoom)) {
			socket.to(threadRoom).emit("joinThread", { ok: true });
		}
	});
};
