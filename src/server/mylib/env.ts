import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEV_MODE = process.env.DEV_MODE === "true";
export const STG_MODE = process.env.STG_MODE === "true";
export const PROD_MODE = !DEV_MODE && !STG_MODE;

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
