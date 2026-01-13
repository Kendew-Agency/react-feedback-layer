import { defineConfig } from "tsup";
import { sassPlugin, postcssModules } from "esbuild-sass-plugin";

export default defineConfig({
	entry: ["src/index.tsx"],
	format: ["esm", "cjs"],
	dts: true,
	sourcemap: true,
	clean: true,
	outExtension({ format }) {
		return format === "cjs" ? { js: ".cjs" } : { js: ".mjs" };
	},
  splitting: false,
});
