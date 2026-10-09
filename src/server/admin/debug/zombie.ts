import type { Request, Response, Router } from "express";
import type { Server } from "socket.io";
import {
	online,
	onlineByIPPrefix,
	onlineByUserId,
} from "../../mylib/socket.js";

const api = "/debug/zombie";

/**
 * 切断済みのsocket.idを掃除する
 */
const sweep = <K>(map: Map<K, Set<string>>, io: Server) => {
	for (const [key, s] of map) {
		for (const socketId of s) {
			if (!io.sockets.sockets.has(socketId)) s.delete(socketId);
		}
		if (s.size === 0) map.delete(key);
	}
};

export default (router: Router, io: Server) => {
	// GET: ゾンビ接続の確認
	router.get(api, (req: Request, res: Response) => {
		res.status(200).json({
			size: online.size,
			online: [...online.entries()].map(([key, set]) => [key, [...set]]),
		});
		return;
	});

	// POST: ゾンビ接続の掃除
	router.post(api, async (req: Request, res: Response) => {
		// ユーザー単位・/48単位の枠もゾンビに占有されないように一緒に掃除する
		sweep(online, io);
		sweep(onlineByIPPrefix, io);
		sweep(onlineByUserId, io);
		res.status(200).json({
			message: "ゾンビ接続を掃除しました。",
			size: online.size,
			online: [...online.entries()].map(([key, set]) => [key, [...set]]),
		});
		return;
	});
};
