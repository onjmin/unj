import * as fs from "node:fs";
import path from "node:path";
import type { Request, Response, Router } from "express";
import readLastLines from "read-last-lines";
import * as v from "valibot";
import { ROOT_PATH } from "../../mylib/env.js";
import { levels } from "../../mylib/log.js";

const api = "/log/grep";
const tooManyThreshold = 65536;
const logDir = path.resolve(ROOT_PATH, "logs");

// mylib/log.ts の命名（DD-MM-YYYY.log、サイズ超過時は .1 .2 … が付く）だけ通す
// （アンカー無しだと logs/ の外を指す値も通ってしまうため）
const logFileNameRegex = /^\d{2}-\d{2}-\d{4}\.log(\.\d{1,4})?$/;

const schema = v.strictObject({
	fileName: v.pipe(v.string(), v.regex(logFileNameRegex)),
	level: v.pipe(
		v.string(),
		v.check((input) => levels.includes(input.toLocaleLowerCase())),
	),
	max: v.pipe(
		v.number(),
		v.integer(),
		v.minValue(1),
		v.maxValue(tooManyThreshold),
	),
});

export default (router: Router) => {
	router.post(api, async (req: Request, res: Response) => {
		const result = v.safeParse(schema, req.body);
		if (!result.success) {
			res.status(400).json({ error: v.flatten(result.issues) });
			return;
		}
		if (Number.isNaN(result.output.max)) {
			res.status(400).json({
				error: `Invalid 'max'. Expected a number from 1 to ${tooManyThreshold}.`,
			});
			return;
		}
		const filePath = path.resolve(logDir, result.output.fileName);

		// 念のため、解決後のパスが logs/ の直下であることも確かめる
		const relativePath = path.relative(logDir, filePath);
		if (
			!relativePath ||
			relativePath.startsWith("..") ||
			path.isAbsolute(relativePath) ||
			path.dirname(relativePath) !== "."
		) {
			res.status(400).json({ error: "Invalid 'fileName'." });
			return;
		}

		if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
			res.status(404).json({ error: "Log file not found." });
			return;
		}

		const lines = (await readLastLines.read(filePath, result.output.max))
			.trim()
			.split("\n")
			.reverse();

		res.status(200).json({
			logs:
				result.output.level === "*"
					? lines
					: lines.filter((v) => v.includes(result.output.level.toUpperCase())),
		});
		return;
	});
};
