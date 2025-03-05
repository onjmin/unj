import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, "..");
const sourcePath = path.join(dir, "static");
const destPath = path.join(dir, "dist/client");

try {
	console.log("🤖", "dist/clientにstaticを転送");

	await cp(sourcePath, path.join(destPath, "static"), {
		recursive: true,
	});
	console.log("✅", "Folder copied successfully!");
} catch (error) {
	console.error("❌", "Failed to copy folder:", error);
	process.exit(1);
}
