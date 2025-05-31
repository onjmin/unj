import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, "..");
const sourceDir1 = path.join(dir, "static");
const sourceDir2 = path.join(dir, "src", "client");
const destPath = path.join(dir, "dist", "client");

try {
	console.log("🤖", "dist/clientにstaticと_redirectsを転送");

	await cp(sourceDir1, path.join(destPath, "static"), {
		recursive: true,
	});
	await cp(
		path.join(sourceDir2, "_redirects"),
		path.join(destPath, "_redirects"),
	);
	await cp(path.join(sourceDir2, "_headers"), path.join(destPath, "_headers"));
	console.log("✅", "Folder copied successfully!");
} catch (error) {
	console.error("❌", "Failed to copy folder:", error);
	process.exit(1);
}
