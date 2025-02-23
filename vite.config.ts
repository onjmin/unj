import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import {
	BASE_URL,
	DEV_MODE,
	PROD_MODE,
	STG_MODE,
} from "./src/server/mylib/env.js";
import { logError, logWarning } from "./src/server/mylib/log.js";

const define = {
	"import.meta.env.BASE_URL": JSON.stringify(BASE_URL),
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
if (BASE_URL !== "/") {
	if (DEV_MODE) {
		logWarning("そのBASE_URLは開発ビルドで合ってる？");
	} else if (STG_MODE) {
		logWarning("そのBASE_URLは検証ビルドで合ってる？");
	}
}
if (BASE_URL === "/" && PROD_MODE) {
	logWarning("そのBASE_URLは本番ビルドで合ってる？");
}

export default defineConfig({
	plugins: [svelte()],
	base: BASE_URL,
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
