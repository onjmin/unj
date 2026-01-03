import type { Request, Response, Router } from "express";
import type { Server } from "socket.io";
import { online } from "../../mylib/socket.js";

const api = "/debug/zombie";

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
		for (const [ip, s] of online) {
			for (const socketId of s) {
				if (!io.sockets.sockets.has(socketId)) s.delete(socketId);
			}
			if (s.size === 0) online.delete(ip);
		}
		res.status(200).json({
			message: "ゾンビ接続を掃除しました。",
			size: online.size,
			online: [...online.entries()].map(([key, set]) => [key, [...set]]),
		});
		return;
	});
};
