import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { RpgPatchSchema } from "../../common/request/rpg-schema.js";
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
import { TokenBucket } from "../mylib/token-bucket.js";

const api = "rpgPatch";

// 連打の間引き。着せ替えは移動と合わせて一瞬で2件飛ぶので、少しまとめ打ちを許す
const tokenBucket = new TokenBucket({
	capacity: 5,
	refillRate: 10,
	costPerAction: 1,
});

export default ({ socket }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const rpgInit = v.safeParse(RpgPatchSchema, data);
		if (!rpgInit.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(rpgInit.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		// 実在する（readThread済みの）スレで、参加しているroomにだけ配信させる
		const room = getThreadRoom(threadId);
		if (!threadCached.has(threadId) || !joined(socket, room)) return;

		const userId = auth.getUserId(socket);
		if (!tokenBucket.attempt(userId)) return;

		// 上限に達したときの掃除でスレごと消えていても作り直す
		const m = prepareDoppelgangers(threadId);
		if (!m) return;

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
			limitDoppelgangersPerUser(userId, threadId);
			d = new Doppelganger(human);
			m.set(userId, d);
		}
		d.x = rpgInit.output.x;
		d.y = rpgInit.output.y;
		d.direction = rpgInit.output.direction;
		d.updatedAt = new Date();

		const player: Player = {
			userId: genRpgUserId(userId, threadId),
			sAnimsId: d.human.sAnimsId,
			msg: d.msg,
			x: d.x,
			y: d.y,
			direction: d.direction,
			updatedAt: d.updatedAt,
		};

		// 識別子は日付が変わると変わるので、本人にはyoursで今の値を知らせる
		socket.emit(api, { ok: true, player, yours: player.userId });
		socket.to(room).emit(api, { ok: true, player });
	});
};
