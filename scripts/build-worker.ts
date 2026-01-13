import { build } from "esbuild"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const entryPoint = resolve(__dirname, "../worker/index.ts")
const outfile = resolve(__dirname, "../dist/_worker.js")

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
