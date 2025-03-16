import type { Request, Response, Router } from "express";
import * as v from "valibot";
import { levels, logger } from "../../mylib/log.js";

const api = "/log/level";

const logLevelSchema = v.pipe(
	v.string("Log level is required."),
	v.check(
		(input) => levels.includes(input.toLocaleLowerCase()),
		"Invalid log level.",
	),
);

export default (router: Router) => {
	router.get(api, (req: Request, res: Response) => {
		const { level } = logger;
		res.status(200).json({
			level,
		});
		return;
	});
	router.post(api, async (req: Request, res: Response) => {
		const level: string = req.body.level;
		const result = v.safeParse(logLevelSchema, level);
		if (!result.success) {
			res.status(400).json({ error: v.flatten(result.issues) });
			return;
		}
		logger.level = level === "*" ? "silly" : level;
		res.status(200).json({
			message: "Log level changed successfully",
			level,
		});
		return;
	});
};
