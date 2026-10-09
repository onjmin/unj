import { addMinutes, isAfter } from "date-fns";
import type { Socket } from "socket.io";
import * as v from "valibot";
import { RpgInitSchema } from "../../common/request/rpg-schema.js";
import type { Player } from "../../common/response/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { isDeleted, threadCached } from "../mylib/cache.js";
import {
	Doppelganger,
	genRpgUserId,
	Human,
	humans,
	limitDoppelgangersPerUser,
	prepareDoppelgangers,
} from "../mylib/rpg.js";
import { getThreadRoom, joined } from "../mylib/socket.js";

const api = "rpgInit";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const rpgInit = v.safeParse(RpgInitSchema, data);
		if (!rpgInit.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(rpgInit.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		// 実在する（readThread済みの）スレのroomに参加しているときだけ受け付ける
		// joinThread/readThreadより先に届くことがあるので、クライアントはok:falseを見て再送する
		if (
			!threadCached.has(threadId) ||
			!joined(socket, getThreadRoom(threadId))
		) {
			socket.emit(api, { ok: false });
			return;
		}

		const m = prepareDoppelgangers(threadId);
		if (!m) {
			socket.emit(api, { ok: false });
			return;
		}

		const userId = auth.getUserId(socket);
		const mine = m.get(userId);
		if (mine) {
			// 下のループで自分だけ期限切れとして消されないように
			mine.updatedAt = new Date();
		} else {
			if (!humans.has(userId)) humans.set(userId, new Human());
			const human = humans.get(userId);
			if (!human) return;
			human.sAnimsId = rpgInit.output.sAnimsId;
			limitDoppelgangersPerUser(userId, threadId);
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
				userId: genRpgUserId(k, threadId),
				sAnimsId: d.human.sAnimsId,
				msg: d.msg,
				x: d.x,
				y: d.y,
				direction: d.direction,
				updatedAt: d.updatedAt,
			});
		}

		const encoded = genRpgUserId(userId, threadId);
		socket.emit(api, {
			ok: true,
			players,
			yours: encoded,
		});
		const player = players.find((p) => p.userId === encoded);
		if (player) {
			socket.to(getThreadRoom(threadId)).emit("rpgPatch", {
				ok: true,
				player,
			});
		}
	});
};
