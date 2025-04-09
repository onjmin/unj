import { promises as fs } from "node:fs";
import path from "node:path";
import type { Request, Response, Router } from "express";
import { isSerial } from "../../../common/request/schema.js";
import { ROOT_PATH } from "../../mylib/env.js";

const api = "/blacklist/id";
const tooManyThreshold = 65536;
export const blacklist: Set<number> = new Set();
const filePath = path.resolve(ROOT_PATH, "blacklist", "id.txt");

const readBlacklist = async () => {
	const data = await fs.readFile(filePath, "utf8");
	return data
		.trim()
		.split("\n")
		.filter((v) => v)
		.map((v) => v.trim())
		.map(Number)
		.filter(isSerial);
};

const writeBlacklist = () =>
	fs.writeFile(filePath, [...blacklist].join("\n"), "utf8");

export default (router: Router) => {
	router.get(api, (req: Request, res: Response) => {
		res.status(200).json({
			count: blacklist.size,
			list: Array.from(blacklist),
		});
		return;
	});
	router.post(api, async (req: Request, res: Response) => {
		try {
			const list = await readBlacklist();
			if (list.length > tooManyThreshold) {
				res.status(413).json({ error: "The fetched list is too large." });
				return;
			}
			blacklist.clear();
			for (const id of list) {
				blacklist.add(id);
			}
			res.status(200).json({
				message: "blacklist updated successfully.",
				count: blacklist.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
	router.put(api, async (req: Request, res: Response) => {
		try {
			const userId = Number(req.query.userId);
			if (!isSerial(userId)) {
				res.status(400).json({ error: "Field 'userId' expected a SERIAL." });
				return;
			}
			if (!blacklist.size && !req.body.force) {
				res.status(412).json({
					error: "Precondition failed: The blacklist not initialized.",
				});
				return;
			}
			if (blacklist.size > tooManyThreshold) {
				res.status(413).json({ error: "The blacklist is full." });
				return;
			}
			if (blacklist.has(userId)) {
				res
					.status(409)
					.json({ error: "userId already exists in the blacklist." });
				return;
			}
			blacklist.add(userId);
			await writeBlacklist();
			res.status(200).json({
				message: "userId added to the blacklist successfully.",
				count: blacklist.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
	router.delete(api, async (req: Request, res: Response) => {
		try {
			const userId = Number(req.query.userId);
			if (!isSerial(userId)) {
				res.status(400).json({ error: "Field 'userId' expected a SERIAL." });
				return;
			}
			if (!blacklist.size && !req.body.force) {
				res.status(412).json({
					error: "Precondition failed: The blacklist not initialized.",
				});
				return;
			}
			if (!blacklist.has(userId)) {
				res.status(404).json({ error: "userId not found in the blacklist." });
				return;
			}
			blacklist.delete(userId);
			await writeBlacklist();
			res.status(200).json({
				message: "userId removed from the blacklist successfully.",
				count: blacklist.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
};
