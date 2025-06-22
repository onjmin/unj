import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, "..", "..");
const sourcePath = path.join(dir, "unj", "dist", "client");
const sourcePath2 = path.join(dir, "unj", "static");
const sourcePath3 = path.join(dir, "unj", "dist", "server.cjs");
// const destPathClient = path.join(dir, "unjupiter", "docs");
const destPathServer = path.join(dir, "onjmin", "dist", "server.cjs");

try {
	console.log("🤖", "別のリポジトリにファイル転送");

	// await rm(destPathClient, { recursive: true, force: true });
	// console.log("🗑️", "Removed existing docs folder");

	// await cp(sourcePath, destPathClient, { recursive: true });
	// await cp(sourcePath2, path.join(destPathClient, "static"), {
	// recursive: true,
	// });
	await cp(sourcePath3, destPathServer);
	console.log("✅", "Folder copied successfully!");
} catch (error) {
	console.error("❌", "Failed to copy folder:", error);
	process.exit(1);
}
