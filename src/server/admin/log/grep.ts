import * as fs from "node:fs";
import path from "node:path";
import { format } from "date-fns";
import type { Request, Response, Router } from "express";
import readLastLines from "read-last-lines";
import * as v from "valibot";
import { getFirstError } from "../../../common/request/util.js";
import { ROOT_PATH } from "../../mylib/env.js";
import { levels } from "../../mylib/log.js";

const api = "/log/grep";
const tooManyThreshold = 65536;

const logLevelSchema = v.pipe(
	v.string("Log level is required."),
	v.check(
		(input) => levels.includes(input.toLocaleLowerCase()),
		"Invalid log level.",
	),
);

export default (router: Router) => {
	router.post(api, async (req: Request, res: Response) => {
		const level: string = req.body.level;
		const max: number = Math.min(req.body.max ?? 32, tooManyThreshold);
		const error = getFirstError(logLevelSchema, level);
		if (error) {
			res.status(400).json({ error });
			return;
		}
		if (Number.isNaN(max)) {
			res.status(400).json({
				error: `Invalid 'max'. Expected a number from 1 to ${tooManyThreshold}.`,
			});
			return;
		}
		const timestamp = format(new Date(), "yyyy-MM-dd");
		const filePath = path.resolve(ROOT_PATH, "logs", `${timestamp}.log`);

		if (!fs.existsSync(filePath)) {
			res.status(404).json({ error: "Log file not found." });
			return;
		}

		const lines = (await readLastLines.read(filePath, max))
			.trim()
			.split("\n")
			.reverse();

		res.status(200).json({
			logs:
				level === "*"
					? lines
					: lines.filter((v) => v.includes(level.toUpperCase())),
		});
		return;
	});
};
