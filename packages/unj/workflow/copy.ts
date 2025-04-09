import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, "..", "src", "client");
const sourcePath = path.join(dir, "index.html");
const destPath = path.join(dir, "404.html");

try {
	console.log("🤖", "404.htmlファイルの生成");

	await copyFile(sourcePath, destPath);
	console.log("✅", "404.html copied successfully!");
} catch (error) {
	console.error("❌", "Failed to copy 404.html:", error);
	process.exit(1);
}
