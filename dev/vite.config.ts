import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Import the library straight from source so the dev app tracks local changes.
const weightedGrid = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const weightedGridReact = fileURLToPath(new URL("../src/react.tsx", import.meta.url));

// react is an *optional* peer dep of weighted-grid, so vite stubs it when resolving ../src/react.tsx.
// Force it onto the dev app's real react install.
const require = createRequire(import.meta.url);
const reactMod = require.resolve("react");
const jsxRuntime = require.resolve("react/jsx-runtime");
const jsxDevRuntime = require.resolve("react/jsx-dev-runtime");

export default defineConfig({
  build: {
    target: "es2020",
    minify: "oxc",
    cssMinify: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/": `${fileURLToPath(new URL("./src", import.meta.url))}/`,
      "weighted-grid/react": weightedGridReact,
      "weighted-grid": weightedGrid,
      "react/jsx-runtime": jsxRuntime,
      "react/jsx-dev-runtime": jsxDevRuntime,
      react: reactMod,
    },
  },
});
