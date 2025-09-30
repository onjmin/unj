import type { Request, Response, Router } from "express";
import type { Server } from "socket.io";
import type { Online } from "../../mylib/socket.js";

const api = "/emergency/deny-all";

// 攻撃遮断フラグ（モジュール変数）
let denyAllFlag = false;

export default (router: Router, io: Server, online: Online) => {
	// GET: 現在の denyAll 状態を返す
	router.get(api, (req: Request, res: Response) => {
		res.status(200).json({
			denyAll: denyAllFlag,
		});
	});

	// POST: denyAll を ON/OFF する
	// body: { denyAll: true } または { denyAll: false }
	router.post(api, (req: Request, res: Response) => {
		const { denyAll } = req.body;
		if (typeof denyAll !== "boolean") {
			res.status(400).json({ error: "denyAll must be boolean" });
			return;
		}
		denyAllFlag = denyAll;
		res.status(200).json({
			message: `denyAll set to ${denyAllFlag}`,
			denyAll: denyAllFlag,
		});
	});
};

// 他のモジュールでも使えるように export しておく
export const isDenyAll = () => denyAllFlag;
