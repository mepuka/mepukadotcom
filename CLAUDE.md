# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website built with Astro (frontend/blog) + Effect (edge backend) on Cloudflare Pages Advanced Mode. Single deploy serves both static content and API routes from the same origin.

## Architecture

```
yourdomain.com/*
  ├─ static content (Astro build output: blog + pages + demos)
  └─ /api/*  → Effect backend (runs at edge) → D1 (persistence) + external APIs
```

**Key pattern**: Pages Advanced Mode uses a `_worker.js` in build output. Routes `/api/*` to Effect handlers, everything else to `env.ASSETS.fetch(request)` for static assets.

## Stack

- **Frontend**: Astro with Content Collections (blog/MDX) and Cloudflare adapter
- **Backend**: Effect on Cloudflare Workers runtime
  - `@effect/platform` HttpApi for routing
  - `HttpApiBuilder.toWebHandler(...)` exports web-compatible handler
  - `@effect/sql-d1` for database access
  - Effect Schema for validation at API boundaries
- **Persistence**: Cloudflare D1 (SQLite semantics)
- **Deploy**: Cloudflare Pages with GitHub integration

## Expected Directory Structure

```
src/                  # Astro site (pages, components, demos)
src/content/blog/     # Markdown/MDX blog posts
src/content.config.ts # Content Collections schema

worker/
  index.ts            # Effect backend entry + HttpApi wiring
  services/           # Layers: DB, external clients, config
  api/                # HttpApi definitions + handlers
  domain/             # Schemas + DTOs (Effect Schema)

dist/                 # Astro build output (generated)
scripts/
  build-worker.mjs    # emits dist/_worker.js from worker/index.ts
wrangler.toml         # Pages project config + bindings
```

## Commands

```bash
# Development
npm run dev              # Astro dev server
wrangler dev             # Local development with D1 bindings

# Build
npm run build            # Build Astro + worker to dist/

# Database
wrangler d1 migrations apply <DB_NAME>           # Apply migrations (prod)
wrangler d1 migrations apply <DB_NAME> --local   # Apply migrations (local)

# Types
wrangler types           # Generate Env types from bindings

# Testing
bun run test             # Run all tests
bun run test:watch       # Watch mode
bunx vitest run -t "pattern"  # Run tests matching pattern

# Deploy
git push                 # GitHub integration auto-deploys
```

## Effect Patterns

### Effect.gen and Effect.fn

Use `Effect.gen` for sequential effectful code. Use `Effect.fn` for named, traced functions:

```typescript
const processUser = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(`Processing user ${userId}`)
  const user = yield* getUser(userId)
  return yield* processData(user)
})
```

### Services and Layers

Define services with `Context.Tag`, implement with `Layer.effect`:

```typescript
class Users extends Context.Tag("@app/Users")<
  Users,
  {
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFound>
  }
>() {
  static readonly layer = Layer.effect(
    Users,
    Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient

      const findById = Effect.fn("Users.findById")(function* (id: UserId) {
        const response = yield* http.get(`/api/users/${id}`)
        return yield* HttpClientResponse.schemaBodyJson(User)(response)
      })

      return Users.of({ findById })
    })
  )
}
```

**Layer naming**: camelCase with `Layer` suffix: `layer`, `testLayer`, `postgresLayer`

**Layer memoization**: Store parameterized layers in constants to avoid duplicate resource allocation.

### Data Modeling with Schema

Use `Schema.Class` for records, `Schema.TaggedClass` + `Schema.Union` for variants:

```typescript
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
}) {}
```

**Brand all domain primitives** - IDs, emails, ports, etc.

### Error Handling

Use `Schema.TaggedError` for domain errors:

```typescript
class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()(
  "UserNotFoundError",
  { id: UserId }
) {}
```

TaggedErrors are yieldable - no need to wrap with `Effect.fail()`.

Use `Effect.catchTag` or `Effect.catchTags` for recovery. Use `Effect.orDie` for unrecoverable errors at boundaries.

### Config

Create config services with layers:

```typescript
class ApiConfig extends Context.Tag("@app/ApiConfig")<
  ApiConfig,
  { readonly apiKey: Redacted.Redacted; readonly baseUrl: string }
>() {
  static readonly layer = Layer.effect(
    ApiConfig,
    Effect.gen(function* () {
      const apiKey = yield* Config.redacted("API_KEY")
      const baseUrl = yield* Config.string("API_BASE_URL")
      return ApiConfig.of({ apiKey, baseUrl })
    })
  )
}
```

Use `Config.redacted()` for secrets. Use `Schema.Config()` for validated config.

### Testing with @effect/vitest

```typescript
import { describe, expect, it } from "@effect/vitest"

it.effect("test name", () =>
  Effect.gen(function* () {
    const result = yield* someEffect
    expect(result).toBe(expected)
  }).pipe(Effect.provide(testLayer))
)
```

- `it.effect()` - standard Effect tests (provides TestClock)
- `it.scoped()` - tests with scoped resources (auto-cleanup)
- `it.live()` - tests with real clock

### Cloudflare Integration

- Worker receives `fetch(request, env, ctx)` - env contains D1 binding (`env.DB`), secrets, KV
- Model external API calls as Effect service layers with retries, timeouts
- Use `ctx.waitUntil(...)` for background tasks without delaying response
- D1's `batch()` provides transactional writes

## TypeScript Configuration

Key settings for Effect projects:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "module": "preserve",           // bundled apps
    "moduleResolution": "bundler",
    "plugins": [{ "name": "@effect/language-service" }]
  }
}
```

## Content

- Blog posts: Markdown/MDX in `src/content/blog/` with Content Collections schema validation
- Mini-apps: Under `/labs/*`, `/projects/*`, or `/apps/*` - can be static or use `/api/*`

## Effect Reference Source

The Effect repository is cloned locally at `~/.local/share/effect-solutions/effect/` for reference when implementing patterns.

**Key directories to explore:**
- `packages/effect/src/` - Core Effect APIs
- `packages/platform/src/` - HttpApi, HttpClient, HttpServer
- `packages/sql-d1/src/` - D1 database integration
- `packages/*/test/` - Real usage examples

When unsure about Effect syntax or patterns, grep this source rather than guessing. Example:
```bash
grep -r "HttpApiBuilder.group" ~/.local/share/effect-solutions/effect/packages/
```
