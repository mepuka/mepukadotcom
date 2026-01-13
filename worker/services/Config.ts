import { Context, Layer } from "effect"

// Cloudflare env bindings interface
export interface CloudflareEnv {
  readonly DB: D1Database
  readonly ASSETS: Fetcher
}

// Config service for accessing Cloudflare bindings
export class Config extends Context.Tag("@worker/Config")<
  Config,
  {
    readonly env: CloudflareEnv
    readonly ctx: ExecutionContext
  }
>() {
  static layer(env: CloudflareEnv, ctx: ExecutionContext) {
    return Layer.succeed(Config, Config.of({ env, ctx }))
  }
}
