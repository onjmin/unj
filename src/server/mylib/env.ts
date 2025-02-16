import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEV_MODE = process.env.DEV_MODE === "true";
export const STG_MODE = process.env.STG_MODE === "true";

export let ROOT_PATH = "";
if (DEV_MODE) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	ROOT_PATH = path.resolve(__dirname, "..", "..", "..");
} else {
	ROOT_PATH = path.resolve(__dirname, "..");
}
