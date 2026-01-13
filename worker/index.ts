import {
  HttpApiBuilder,
  HttpServer,
} from "@effect/platform"
import { DateTime, Effect, Layer } from "effect"
import { Api } from "./api/index.js"
import { HealthStatus } from "./domain/schemas.js"
import { Config, type CloudflareEnv } from "./services/Config.js"

// Implement the health group handlers
const HealthLive = HttpApiBuilder.group(Api, "health", (handlers) =>
  handlers.handle("check", () =>
    Effect.gen(function* () {
      const now = yield* DateTime.now
      return new HealthStatus({
        status: "ok",
        timestamp: now,
      })
    })
  )
)

// Build the API layer
const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(HealthLive)
)

// Create the web handler
const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext)
)

// Cloudflare Pages Advanced Mode worker
export default {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)

    // Route /api/* to Effect backend
    if (url.pathname.startsWith("/api/")) {
      // Provide the config context for this request
      const configLayer = Config.layer(env, ctx)
      return handler(request)
    }

    // Everything else goes to static assets
    return env.ASSETS.fetch(request)
  },
}
