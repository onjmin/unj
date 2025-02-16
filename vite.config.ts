import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const DEV_MODE = process.env.DEV_MODE === "true";

export default defineConfig({
	plugins: [svelte()],
	root: "src/client",
	envDir: "../../",
	// mode: DEV_MODE ? "development" : "production", // vite buildだと無視される
	define: {
		"import.meta.env.DEV_MODE": DEV_MODE,
	},
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
