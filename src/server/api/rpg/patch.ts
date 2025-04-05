import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { RpgPatchSchema } from "../../../common/request/rpg-schema.js";
import type { Player } from "../../../common/response/schema.js";
import { decodeThreadId, encodeUserId } from "../../mylib/anti-debug.js";
import auth from "../../mylib/auth.js";
import { isDeleted } from "../../mylib/cache.js";
import { bigDay, doppelgangers, humans } from "../../mylib/rpg.js";
import { getThreadRoom } from "../../mylib/socket.js";

const api = "rpgPatch";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const rpgInit = v.safeParse(RpgPatchSchema, data);
		if (!rpgInit.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(rpgInit.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		const m = doppelgangers.get(threadId);
		if (!m) return;

		const userId = auth.getUserId(socket);
		const human = humans.get(userId);
		if (!human) return;
		human.sAnimsId = rpgInit.output.sAnimsId;

		const d = m.get(userId);
		if (!d) return;
		d.x = rpgInit.output.x;
		d.y = rpgInit.output.y;
		d.direction = rpgInit.output.direction;

		const player: Player = {
			userId: encodeUserId(userId, bigDay) ?? "",
			sAnimsId: d.human.sAnimsId,
			msg: d.human.msg,
			x: d.x,
			y: d.y,
			direction: d.direction,
		};

		io.to(getThreadRoom(threadId)).emit(api, {
			ok: true,
			player,
		});
	});
};
