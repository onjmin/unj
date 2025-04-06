import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { RpgPatchSchema } from "../../common/request/rpg-schema.js";
import type { Player } from "../../common/response/schema.js";
import { decodeThreadId, encodeUserId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { isDeleted } from "../mylib/cache.js";
import {
	Doppelganger,
	Human,
	bigDay,
	doppelgangers,
	humans,
} from "../mylib/rpg.js";
import { getThreadRoom } from "../mylib/socket.js";

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
		let human = humans.get(userId);
		if (!human) {
			// その他の失効の補正
			human = new Human();
			humans.set(userId, human);
		}
		human.sAnimsId = rpgInit.output.sAnimsId;

		let d = m.get(userId);
		if (!d) {
			// 有効期限切れの補正
			d = new Doppelganger(human);
			m.set(userId, d);
		}
		d.x = rpgInit.output.x;
		d.y = rpgInit.output.y;
		d.direction = rpgInit.output.direction;
		d.updatedAt = new Date();

		const player: Player = {
			userId: encodeUserId(userId, bigDay) ?? "",
			sAnimsId: d.human.sAnimsId,
			msg: d.human.msg,
			x: d.x,
			y: d.y,
			direction: d.direction,
			updatedAt: d.updatedAt,
		};

		io.to(getThreadRoom(threadId)).emit(api, {
			ok: true,
			player,
		});
	});
};
