import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    modulePreload: {
      polyfill: false,
    },
  },
  esbuild: {
    target: "esnext",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  assetsInclude: ["**/*.wgsl", "**/*.glsl"],
});