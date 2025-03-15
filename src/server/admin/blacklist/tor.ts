import type { Request, Response, Router } from "express";

const api = "/blacklist/tor";
const tooManyThreshold = 65536;
export const torIPList: Set<string> = new Set();

export default (router: Router) => {
	router.get(api, (req: Request, res: Response) => {
		res.status(200).json({
			count: torIPList.size,
			list: Array.from(torIPList),
		});
		return;
	});
	router.post(api, async (req: Request, res: Response) => {
		try {
			const list = (
				await (await fetch("https://www.dan.me.uk/torlist/?exit")).text()
			)
				.trim()
				.split("\n")
				.map((v) => v.trim())
				.filter((v) => v);
			if (list.length > tooManyThreshold) {
				res.status(413).json({ error: "The fetched list is too large." });
				return;
			}
			torIPList.clear();
			for (const ip of list) {
				torIPList.add(ip);
			}
			res.status(200).json({
				message: "Tor IP list updated successfully.",
				count: torIPList.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
};
