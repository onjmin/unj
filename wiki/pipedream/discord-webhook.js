import { differenceInSeconds, format } from "date-fns";
import { ja } from "date-fns/locale";
import { sha256 } from "js-sha256";

const delimiter = "###";

const PIPEDREAM_API_SECRET_PEPPER = "";
const PIPEDREAM_API_SECRET_INTERVAL = 187;

/**
 * Pipedream用の時限式トークンを計算する
 */
const genPipedreamApiTimedToken = () => {
	const secondsSinceEpoch = differenceInSeconds(new Date(), new Date(0));
	const basedTime = Math.floor(
		secondsSinceEpoch / PIPEDREAM_API_SECRET_INTERVAL,
	);
	console.log(basedTime);
	const str = sha256([PIPEDREAM_API_SECRET_PEPPER, basedTime].join(delimiter));
	return str.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

const map = new Map();
map.set("contactKaizen", "");
map.set("contactAGPL3", "");
map.set("contactPolice", "");
map.set("userReport", "");
map.set("reportTraversal", "");
map.set("reportBanned", "");

const send = (url, array) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			content: [
				"```",
				format(new Date(), "yyyy年MM月dd日 HH時mm分ss秒", { locale: ja }),
				array.join("\n").replace(/`/g, ""),
				"```",
			].join("\n"),
			allowed_mentions: {
				parse: [],
			},
		}),
	});

export default defineComponent({
	async run({ steps, $ }) {
		const { token, kind, array } = steps.trigger.event;

		if (token !== genPipedreamApiTimedToken()) {
			await $.respond({
				status: 401,
				body: {
					error: "Unauthorized: Invalid token",
				},
			});
			return;
		}

		// kindが無効、またはarrayが空、16個を超えている、またはarrayの長さが1024文字を超える場合、400を返す
		if (
			!map.has(kind) ||
			!array.length ||
			array.length > 16 ||
			array.join("\n").length > 1024
		) {
			await $.respond({
				status: 400,
				body: {
					error: "Bad Request: Invalid parameters",
				},
			});
			return;
		}

		try {
			// 何かの処理を送信
			send(map.get(kind), array);
		} catch (err) {
			// サーバー側でエラーが発生した場合、500を返す
			await $.respond({
				status: 500,
				body: {
					error: "Internal Server Error: Failed to process the request",
				},
			});
			return;
		}

		// 成功時のレスポンス（204 No Content）
		await $.respond({
			status: 204,
			body: {
				ok: true,
			},
		});
		return;
	},
});
