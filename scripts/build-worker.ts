import { build } from "esbuild"
import { resolve } from "path"

const entryPoint = resolve(import.meta.dir, "../worker/index.ts")
const outfile = resolve(import.meta.dir, "../dist/_worker.js")

await build({
  entryPoints: [entryPoint],
  outfile,
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser", // Cloudflare Workers use browser-like runtime
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
  external: [], // Bundle everything
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  logLevel: "info",
})

console.log("Worker built successfully: dist/_worker.js")
