import {
	DEV_MODE,
	PROD_MODE,
	STG_MODE,
	VITE_BASE_URL,
	genEnvKey,
} from "./src/server/mylib/env.js";

import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import chalk from "chalk";
import { defineConfig } from "vite";
import { encode } from "./src/common/anti-debug.js";
import { randInt } from "./src/common/util.js";

// ビルド時の出力
console.log("⚡", `VITE_BASE_URL: "${VITE_BASE_URL}"`);
console.log(
	Object.entries({
		DEV_MODE,
		STG_MODE,
		PROD_MODE,
	})
		.map(([name, isActive]) =>
			isActive ? chalk.green(name) : chalk.gray(name),
		)
		.join(" "),
);

// ビルド時の警告
if (DEV_MODE && STG_MODE) {
	console.error(chalk.bgRed.white("環境変数がおかしい。"));
	console.log(JSON.stringify(process.env, null, 2));
	throw 114514;
}
if (VITE_BASE_URL === "/" && PROD_MODE) {
	console.warn(chalk.bgYellow.black("本番ビルド用のVITE_BASE_URLじゃなさそう"));
}

const ENV_KEY = genEnvKey();

// envの符号化
const env: Map<string, string | boolean> = new Map();
for (const key in process.env) {
	if (key.startsWith("VITE_")) {
		const encoded = encode(process.env[key] ?? null, ENV_KEY);
		env.set(key, encoded ?? "");
	}
}

// 平文のenv
env.set("DEV_MODE", DEV_MODE);
env.set("STG_MODE", STG_MODE);
env.set("PROD_MODE", PROD_MODE);
env.set("ENV_KEY", ENV_KEY);

// dummy env
for (const i of Array(randInt(32, 64)).keys()) {
	env.set(`DUMMY${i}`, genEnvKey());
}

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	base: VITE_BASE_URL,
	root: "src/client",
	define: Object.fromEntries(
		[...env].map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]),
	),
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
