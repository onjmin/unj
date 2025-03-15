import type { Request, Response, Router } from "express";
import * as v from "valibot";
import { getFirstError } from "../../../common/request/util.js";
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
		const error = getFirstError(logLevelSchema, level);
		if (error) {
			res.status(400).json({ error });
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
