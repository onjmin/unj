import { rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "dist");
const sourcePath = path.join(distDir, "server.js");
const destPath = path.join(distDir, "server.cjs");

try {
	await rename(sourcePath, destPath);
	console.log(`ファイルをリネームしました: ${sourcePath} -> ${destPath}`);
} catch (error) {
	console.error("ファイルのリネームに失敗しました:", error);
	process.exit(1);
}
