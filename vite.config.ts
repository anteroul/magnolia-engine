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
  // Make sure source files are processed
  resolve: {
    extensions: [".ts", ".js", ".glsl", ".wgsl"],
  },
});
