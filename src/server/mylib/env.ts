import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { sha256 } from "js-sha256";
import { isSecureValue } from "../../common/anti-debug.js";
import { randInt } from "../../common/util.js";

export const DEV_MODE = process.env.DEV_MODE === "true";
export const STG_MODE = process.env.STG_MODE === "true";
export const PROD_MODE = !DEV_MODE && !STG_MODE;

/**
 * 複号鍵の生成
 *
 * ビルド時に62進数風の複号鍵を生成する。
 * 62進数にした理由は符号化したenvの出力に紛れ込ませるため。
 * 木を隠すなら森の中。
 */
export const genEnvKey = (): string => {
	const key = sha256(Math.random().toString())
		.match(/.{1,9}/g) // 0xFFFFFFFFF.toString(36) === 'vkhsvlr' となり、1桁目がzに近くなる/.{1,9}/なら出力の偏りが少ない
		?.map((v) => Number.parseInt(v, 16).toString(36)) // 36進数に変換
		.join("") // この時点で約49文字
		// エントロピーを維持したまま62進数を作成
		.replace(/[a-z]/g, (char) => {
			return Math.random() > 0.5 ? char.toUpperCase() : char;
		})
		.slice(0, 16 + 4 * randInt(0, 7) + 3); // 4の倍数+3;
	if (!key || !isSecureValue(key)) {
		console.error(chalk.bgRed.white("複号鍵の生成に失敗"));
		throw 114514;
	}
	return key;
};

export const VITE_BASE_URL = PROD_MODE ? process.env.VITE_BASE_URL : "/";
export const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);

export let ROOT_PATH = "";
if (DEV_MODE) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	ROOT_PATH = path.resolve(__dirname, "..", "..", "..");
} else {
	ROOT_PATH = path.resolve(__dirname, "..");
}
