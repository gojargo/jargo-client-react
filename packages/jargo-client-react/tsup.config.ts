import { defineConfig } from "tsup";

// Two entry points so the framework-agnostic core stays free of the
// "use client" directive (usable in any JS env), while the React bindings get
// it stamped on so Next.js App Router treats them as client components.
export default defineConfig([
  {
    entry: { index: "src/core/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2020",
  },
  {
    entry: { react: "src/react/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
    external: ["react", "react-dom"],
    banner: { js: '"use client";' },
  },
]);
