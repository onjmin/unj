import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const DEV_MODE = process.env.DEV_MODE === "true";
console.log(DEV_MODE);

export default defineConfig({
	plugins: [svelte()],
	root: "src/client",
	envDir: "../../",
	build: {
		outDir: "../../dist/client",
		sourcemap: DEV_MODE ? "inline" : false,
		emptyOutDir: true,
	},
});
