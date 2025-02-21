import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, "..", "..");
const sourcePath = path.join(dir, "unj/dist/client");
const sourcePath2 = path.join(dir, "unj/static");
const destPath = path.join(dir, "unjupiter/docs");

try {
	await rm(destPath, { recursive: true, force: true });
	console.log("🗑️ Removed existing docs folder");

	await cp(sourcePath, destPath, { recursive: true });
	await cp(sourcePath2, path.join(destPath, "static"), {
		recursive: true,
	});
	console.log("✅ Folder copied successfully!");
} catch (error) {
	console.error("❌ Failed to copy folder:", error);
	process.exit(1);
}
