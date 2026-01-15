import { defineConfig } from "tsup";

// tsup.config.ts
export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false, // reduces noise a lot
  clean: true,
});

