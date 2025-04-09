import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    alias: {
      "@": resolve(__dirname, "src"), // src を @ に対応させる
    },
  },
});
