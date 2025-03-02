import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import {
	DEV_MODE,
	PROD_MODE,
	STG_MODE,
	VITE_BASE_URL,
} from "./src/server/mylib/env.js";
import { logError, logWarning } from "./src/server/mylib/log.js";

console.log("⚡", `VITE_BASE_URL: "${VITE_BASE_URL}"`);
const define = {
	"import.meta.env.DEV_MODE": DEV_MODE,
	"import.meta.env.STG_MODE": STG_MODE,
	"import.meta.env.PROD_MODE": PROD_MODE,
};
console.log(define);

if (DEV_MODE && STG_MODE) {
	logError("環境変数がおかしい。");
	console.log(JSON.stringify(process.env, null, 2));
	throw 114514;
}
if (VITE_BASE_URL === "/" && PROD_MODE) {
	logWarning("本番ビルド用のVITE_BASE_URLじゃなさそう");
}

export default defineConfig({
	plugins: [svelte()],
	base: VITE_BASE_URL,
	root: "src/client",
	envDir: "../../",
	define,
	build: {
		outDir: "../../dist/client",
		sourcemap: DEV_MODE ? "inline" : false,
		emptyOutDir: true,
		minify: !DEV_MODE,
		rollupOptions: {
			input: {
				main: resolve(__dirname, "src/client/index.html"),
				notFound: resolve(__dirname, "src/client/404.html"),
			},
		},
	},
});
