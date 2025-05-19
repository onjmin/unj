import type { Request, Response, Router } from "express";
import * as v from "valibot";
import { SERIAL, SMALLINT } from "../../../common/request/schema.js";
import { ownerIdCache } from "../../mylib/cache.js";

const api = "/thread/owner";

export default (router: Router) => {
	// GET: クエリパラメータの threadId に対応するスレ主IDを取得
	router.get(api, (req: Request, res: Response) => {
		const threadId = v.safeParse(SERIAL, Number(req.query.threadId));
		if (!threadId.success) {
			res.status(400).json({ error: v.flatten(threadId.issues) });
			return;
		}
		if (!ownerIdCache.has(threadId.output)) {
			res.status(404).json({ error: "指定されたスレは存在しません。" });
			return;
		}
		res.status(200).json({
			threadId: threadId.output,
			userId: ownerIdCache.get(threadId.output),
		});
		return;
	});

	// POST: クエリパラメータの threadId に対応するスレ主IDを更新
	router.post(api, async (req: Request, res: Response) => {
		const threadId = v.safeParse(SERIAL, Number(req.query.threadId));
		const userId = v.safeParse(SERIAL, Number(req.query.userId));
		if (!threadId.success) {
			res.status(400).json({ error: v.flatten(threadId.issues) });
			return;
		}
		if (!ownerIdCache.has(threadId.output)) {
			res.status(404).json({ error: "指定されたスレは存在しません。" });
			return;
		}
		if (!userId.success) {
			res.status(400).json({ error: v.flatten(userId.issues) });
			return;
		}
		ownerIdCache.set(threadId.output, userId.output);
		res.status(200).json({
			message: "スレ主が正常に更新されました。",
			threadId: threadId.output,
			userId: userId.output,
		});
		return;
	});
};
