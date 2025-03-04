import type { Request, Response, Router } from "express";

const api = "/vpngate";
const tooManyThreshold = 65536;
export const vpngateIPList: Set<string> = new Set();

export default (router: Router) => {
	router.get(api, (req: Request, res: Response) => {
		res.status(200).json({
			count: vpngateIPList.size,
			list: Array.from(vpngateIPList),
		});
		return;
	});
	router.post(api, async (req: Request, res: Response) => {
		try {
			const list = (
				await (await fetch("https://www.vpngate.net/api/iphone/")).text()
			)
				.trim()
				.split("\n")
				.map((v) => v.split(",")[1])
				.map((v) => v.trim())
				.filter((v) => v);
			if (list.length > tooManyThreshold) {
				res.status(413).json({ error: "The fetched list is too large." });
				return;
			}
			vpngateIPList.clear();
			for (const ip of list) {
				vpngateIPList.add(ip);
			}
			res.status(200).json({
				message: "VPN Gate IP list updated successfully.",
				count: vpngateIPList.size,
			});
			return;
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error." });
			return;
		}
	});
};
