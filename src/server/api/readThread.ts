import type { Socket } from "socket.io";
import * as v from "valibot";
import { ReadThreadSchema, SERIAL } from "../../common/request/schema.js";
import type { Res, Thread } from "../../common/response/schema.js";
import {
	decodeThreadId,
	encodeThreadId,
	encodeUserId,
} from "../mylib/anti-debug.js";
import Nonce from "../mylib/nonce.js";
import { badCounts, goodCounts } from "./like.js";
import { lolCounts } from "./lol.js";

const api = "readThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const readThread = v.safeParse(ReadThreadSchema, data);
		if (!readThread.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const serial = v.safeParse(
			SERIAL,
			decodeThreadId(readThread.output.threadId),
		);
		if (!serial.success) {
			return;
		}
		const id = serial.output;

		const { cursor, size, desc } = readThread.output;

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, readThread.output.nonce)) {
			return;
		}
		Nonce.lock(socket);
		Nonce.update(socket);

		// 危険な処理
		try {
			// await getThread(result.data)
			// await getPost(result.data);
			if (!lolCounts.has(id)) {
				lolCounts.set(id, 810);
				goodCounts.set(id, 114);
				badCounts.set(id, 514);
			}
			const lolCount = lolCounts.get(id) ?? 0;
			const goodCount = goodCounts.get(id) ?? 0;
			const badCount = badCounts.get(id) ?? 0;
			socket.emit(api, {
				ok: true,
				thread: mock,
			});
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});

	const mock2: Res = {
		isOwner: false,
		num: 1,
		createdAt: new Date(),
		ccUserId: encodeUserId(334, new Date()).slice(0, 4),
		ccUserName: "月沈めば名無し",
		ccUserAvatar: 0,
		content: "草",
		contentUrl: "https://i.imgur.com/7dzm3JU.jpeg",
		contentType: 8,
	};

	const mock: Thread = {
		id: encodeThreadId(9800),
		latestResAt: new Date(),
		resCount: 256,
		title: "【朗報】侍ジャパン、謎のホームランで勝利！",
		lolCount: 3,
		goodCount: 4,
		badCount: 5,
		resList: [...Array(64)].map((v, i) =>
			Object.assign(
				{ ...mock2 },
				{
					num: i + 1,
					contentUrl:
						Math.random() > 0.3
							? "https://i.imgur.com/7dzm3JU.jpeg"
							: "https://youtu.be/3-kI9rDwQ8E",
				},
			),
		),
		deletedAt: new Date(+new Date() + 1000 * 60 * 64),
		ps: "追記",
		resLimit: 1000,
		ageRes: null,
		varsan: false,
		sage: false,
		threadType: 0,
		ccBitmask: 1,
		contentTypesBitmask: 1,
	};
};
