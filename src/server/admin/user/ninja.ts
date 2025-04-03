import type { Request, Response, Router } from "express";
import * as v from "valibot";
import { SERIAL, SMALLINT } from "../../../common/request/schema.js";
import { ninjaScoreCache } from "../../mylib/cache.js";

const api = "/ninja";

export default (router: Router) => {
	// GET: クエリパラメータの userId に対応するスコア取得
	router.get(api, (req: Request, res: Response) => {
		const userId = v.safeParse(SERIAL, Number(req.query.userId));
		if (!userId.success) {
			res.status(400).json({ error: v.flatten(userId.issues) });
			return;
		}
		if (!ninjaScoreCache.has(userId.output)) {
			res
				.status(404)
				.json({ error: "指定されたユーザーIDのスコアは存在しません。" });
			return;
		}
		res.status(200).json({
			userId: userId.output,
			ninjaScore: ninjaScoreCache.get(userId.output),
		});
		return;
	});

	// POST: クエリパラメータの userId に対応するスコアを更新
	router.post(api, async (req: Request, res: Response) => {
		const userId = v.safeParse(SERIAL, Number(req.query.userId));
		if (!userId.success) {
			res.status(400).json({ error: v.flatten(userId.issues) });
			return;
		}
		if (!ninjaScoreCache.has(userId.output)) {
			res
				.status(404)
				.json({ error: "指定されたユーザーIDのスコアは存在しません。" });
			return;
		}
		const ninjaScore = v.safeParse(SMALLINT, req.body.ninjaScore);
		if (!ninjaScore.success) {
			res.status(400).json({ error: v.flatten(ninjaScore.issues) });
			return;
		}
		ninjaScoreCache.set(userId.output, ninjaScore.output);
		res.status(200).json({
			message: "スコアが正常に更新されました。",
			userId: userId.output,
			ninjaScore: ninjaScore.output,
		});
		return;
	});
};
