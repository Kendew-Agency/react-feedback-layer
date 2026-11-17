import { defineConfig } from "tsup";

// tsup.config.ts
export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types/index.ts",
  },
  // Test files are never entries: only the two explicit entries above are bundled.
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false, // reduces noise a lot
  clean: true,
});

