import { promises as fs } from "node:fs";
import path from "node:path";
import type { Request, Response, Router } from "express";
import * as v from "valibot";
import { getFirstError } from "../../common/request/util.js";
import { ROOT_PATH } from "../mylib/env.js";

const api = "/blacklist";
const tooManyThreshold = 65536;
export const blacklist: Set<string> = new Set();
const filePath = path.resolve(ROOT_PATH, "blacklist.txt");
const IpAddressSchema = v.pipe(
	v.string("IP is required."),
	v.ip("The IP is badly formatted."),
);

const readBlacklist = async () => {
	const data = await fs.readFile(filePath, "utf8");
	return data
		.trim()
		.split("\n")
		.map((v) => v.trim())
		.filter((v) => v);
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
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
	router.put(api, async (req: Request, res: Response) => {
		try {
			const ip: string = req.body.ip;
			const error = getFirstError(IpAddressSchema, ip);
			if (error) {
				res.status(400).json({ error });
				return;
			}
			if (blacklist.size > tooManyThreshold) {
				res.status(413).json({ error: "The blacklist is full" });
				return;
			}
			if (blacklist.has(ip)) {
				res.status(409).json({ error: "IP already exists in the blacklist" });
				return;
			}
			blacklist.add(ip);
			await writeBlacklist();
			res.status(200).json({
				message: "IP added to the blacklist successfully",
				count: blacklist.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error" });
			return;
		}
	});
	router.delete(api, async (req: Request, res: Response) => {
		try {
			const ip: string = req.body.ip;
			const error = getFirstError(IpAddressSchema, ip);
			if (error) {
				res.status(400).json({ error });
				return;
			}
			if (!blacklist.has(ip)) {
				res.status(404).json({ error: "IP not found in the blacklist" });
				return;
			}
			blacklist.delete(ip);
			await writeBlacklist();
			res.status(200).json({
				message: "IP removed from the blacklist successfully",
				count: blacklist.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error" });
			return;
		}
	});
};
