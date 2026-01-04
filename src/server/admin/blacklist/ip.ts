import { promises as fs } from "node:fs";
import path from "node:path";
import type { Request, Response, Router } from "express";
import * as v from "valibot";
import { ROOT_PATH } from "../../mylib/env.js";

const api = "/blacklist/ip";
const tooManyThreshold = 65536;
export const blacklist: Set<string> = new Set();
const filePath = path.resolve(ROOT_PATH, "blacklist", "ip.txt");
const IpSchema = v.pipe(
	v.string("IP is required."),
	v.ip("The IP is badly formatted."),
);
const WildcardIPv4Schema = v.pipe(
	v.string("IP is required."),
	v.regex(
		/^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/,
		"Invalid wildcard IP format.",
	),
);
const WildcardIPv6Schema = v.pipe(
	v.string("IP is required."),
	v.regex(
		/^([\da-fA-F]{1,4}|\*)?(:([\da-fA-F]{1,4}|\*)){0,7}(:{1,2}([\da-fA-F]{1,4}|\*)){0,7}$/,
		"Invalid wildcard IP format.",
	),
);
const BlacklistIPSchema = v.union([
	IpSchema,
	WildcardIPv4Schema,
	WildcardIPv6Schema,
]);

const readBlacklist = async () => {
	const data = await fs.readFile(filePath, "utf8");
	return data
		.trim()
		.split("\n")
		.filter((v) => v)
		.map((v) => v.trim());
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
			for (const ip of list) {
				blacklist.add(ip);
			}
			res.status(200).json({
				message: "blacklist updated successfully.",
				count: blacklist.size,
			});
			return;
		} catch {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
	router.put(api, async (req: Request, res: Response) => {
		try {
			const ip = v.safeParse(BlacklistIPSchema, req.query.ip);
			if (!ip.success) {
				res.status(400).json({ error: v.flatten(ip.issues) });
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
			if (blacklist.has(ip.output)) {
				res.status(409).json({ error: "IP already exists in the blacklist." });
				return;
			}
			blacklist.add(ip.output);
			await writeBlacklist();
			res.status(200).json({
				message: "IP added to the blacklist successfully.",
				count: blacklist.size,
			});
			return;
		} catch {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
	router.delete(api, async (req: Request, res: Response) => {
		try {
			const ip = v.safeParse(BlacklistIPSchema, req.query.ip);
			if (!ip.success) {
				res.status(400).json({ error: v.flatten(ip.issues) });
				return;
			}
			if (!blacklist.size && !req.body.force) {
				res.status(412).json({
					error: "Precondition failed: The blacklist not initialized.",
				});
				return;
			}
			if (!blacklist.has(ip.output)) {
				res.status(404).json({ error: "IP not found in the blacklist." });
				return;
			}
			blacklist.delete(ip.output);
			await writeBlacklist();
			res.status(200).json({
				message: "IP removed from the blacklist successfully.",
				count: blacklist.size,
			});
			return;
		} catch {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
};
