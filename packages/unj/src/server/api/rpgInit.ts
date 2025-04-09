import { addMinutes, isAfter } from "date-fns";
import type { Socket } from "socket.io";
import * as v from "valibot";
import { RpgInitSchema } from "../../common/request/rpg-schema.js";
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

const api = "rpgInit";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const rpgInit = v.safeParse(RpgInitSchema, data);
		if (!rpgInit.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(rpgInit.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		if (!doppelgangers.has(threadId)) doppelgangers.set(threadId, new Map());
		const m = doppelgangers.get(threadId);
		if (!m) return;

		const userId = auth.getUserId(socket);
		if (!m.has(userId)) {
			if (!humans.has(userId)) humans.set(userId, new Human());
			const human = humans.get(userId);
			if (!human) return;
			human.sAnimsId = rpgInit.output.sAnimsId;
			m.set(userId, new Doppelganger(human));
		}

		const timestamp = new Date();

		const players: Player[] = [];
		// 途中でループ回数が減る可能性あり
		for (const k of m.keys()) {
			const d = m.get(k);
			if (!d) continue;
			// 有効期限切れ
			if (isAfter(timestamp, addMinutes(d.updatedAt, 4))) {
				m.delete(k);
				continue;
			}
			players.push({
				userId: encodeUserId(k, bigDay) ?? "",
				sAnimsId: d.human.sAnimsId,
				msg: d.human.msg,
				x: d.x,
				y: d.y,
				direction: d.direction,
				updatedAt: d.updatedAt,
			});
		}

		const encoded = encodeUserId(userId, bigDay);
		socket.emit(api, {
			ok: true,
			players,
			yours: encoded,
		});
		socket.to(getThreadRoom(threadId)).emit("rpgPatch", {
			ok: true,
			player: players.find((p) => p.userId === encoded),
		});
	});
};
