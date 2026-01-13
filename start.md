Here’s a Cloudflare-first, **Effect-native TS stack** that stays *clean + simple*, but still gives you **real persistence**, **blogging (Markdown/MDX)**, and **mini-app hosting** with **GitHub-driven deploys**.

## Recommended architecture: Cloudflare Pages + Astro for the site, plus an Effect “edge backend” in Advanced Mode

You get the “one project / one domain” simplicity of Pages + GitHub integration, but your backend is a **single Effect-powered Worker entrypoint** (no Next.js, no server to manage).

### Topology (single deploy, same origin)

```
yourdomain.com/*
  ├─ static content (Astro build output: blog + pages + demos)
  └─ /api/*  → Effect backend (runs at the edge) → D1 (persistence) + external APIs
```

Cloudflare Pages **Advanced mode** is explicitly designed for this: you ship a `_worker.js` in your build output, and it can route `/api/*` to custom logic while using `env.ASSETS.fetch(request)` for everything else (static assets). ([Cloudflare Docs][1])

---

## The stack

### 1) Web / content layer: Astro (blog + marketing + demos)

* **Astro** for the personal site and docs/blog experience.
* **Content Collections** for markdown posts with schema enforcement (frontmatter validation) so your blog content stays consistent. ([Astro Documentation][2])
* **MDX integration** if you want posts that can embed interactive components/demos (perfect for a dev blog). ([Astro Documentation][3])

### 2) Backend layer: Effect on the edge

* **Cloudflare runtime**: your backend code runs as a Worker-style `fetch(request, env, ctx)` handler. ([Cloudflare Docs][4])
* Use `@effect/platform` **HttpApi** (or a plain Effect router if you prefer) and export a single handler.

  * `HttpApiBuilder.toWebHandler(...)` is the key piece: it gives you a web-compatible handler from an Effect HttpApi + Layer graph. ([Effect Ts][5])
* **Effect Schema** for validation/decoding at API boundaries (requests, env config, external API payloads). ([Effect][6])

### 3) Persistence: Cloudflare D1 (SQLite semantics, serverless)

* D1 is Cloudflare’s managed serverless SQL DB (SQLite semantics) and is designed to be used from Workers/Pages. ([Cloudflare Docs][7])
* Your Worker/Pages code receives it via an **env binding** (e.g. `env.DB`). ([Cloudflare Docs][8])
* If you want atomic multi-step writes, D1’s `batch()` runs statements in a transaction; failure rolls back the sequence. ([Cloudflare Docs][9])
* For Effect-native SQL, use `@effect/sql-d1`:

  * `D1ClientConfig` takes `db: D1Database` (plus caching/transform knobs). ([Effect Ts][10])

### 4) Deployment & config: GitHub → Cloudflare Pages (preview URLs included)

* Pages Git integration gives you PR/branch **preview deployments** and status checks, so every change is reviewable. ([Cloudflare Docs][11])
* Put your Pages config + bindings in a `wrangler.toml`/`wrangler.jsonc` and treat it as source of truth; it supports D1 bindings, KV, vars, and per-environment overrides. ([Cloudflare Docs][12])

---

## How to wire the “Advanced mode” Worker cleanly

### The routing pattern

In advanced mode, Pages expects a `_worker.js` in your **build output directory** and you control routing. Cloudflare’s own example pattern is:

* if request path starts with `/api/` → custom logic
* else → `env.ASSETS.fetch(request)` to serve your Astro output ([Cloudflare Docs][1])

That becomes your **stable boundary**:

* **Astro** owns UI + blog rendering
* **Effect** owns `/api/*` + persistence + external integrations

### Why this is great for Effect

* You don’t have to split your backend into file-based Pages Functions routes unless you want to.
* You can run your own router (Effect HttpApi or whatever) behind `/api/*`.
* Your whole backend is “Effect-native,” built around Layers and service boundaries (DB, external clients, config, etc.).

---

## Repo layout that stays simple but scales

You can keep this as a single app repo (recommended) or a monorepo. Here’s a clean “single repo” approach:

```
/
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

Key idea: your **build** produces:

* `dist/` from Astro
* `dist/_worker.js` compiled/bundled from `worker/index.ts` (Effect backend)

---

## Pages + Wrangler configuration: bindings + environments

### Bindings

Pages Functions (and Advanced mode) can be wired to platform resources via **bindings**, including D1, KV, R2, etc., and you can set different bindings for **production vs preview**. ([Cloudflare Docs][13])

If you use a Wrangler config file, Cloudflare recommends treating it as the **source of truth**, and it shows an example including `pages_build_output_dir` plus `d1_databases` bindings. ([Cloudflare Docs][12])

### Preview vs Production

Cloudflare Pages preview deployments are automatic for PRs and branches; you’ll get unique preview URLs. ([Cloudflare Docs][14])
This pairs really well with having a “preview D1” database binding so you don’t test against prod.

---

## Persistence workflow: migrations + local dev

### Migrations

D1 migrations are SQL files tracked in your repo. ([Cloudflare Docs][15])
Applying migrations is handled by Wrangler (`wrangler d1 migrations apply`), including CI-safe behavior (non-interactive skips confirmation but still captures a backup). ([Cloudflare Docs][16])

### Local development

D1 supports local development through Wrangler (Cloudflare positions it as “fully-featured support for local development”). ([Cloudflare Docs][17])

---

## Type-safety and DX: strongly type `env` + bindings

Workers/Pages run in the Workers runtime, and Cloudflare treats TypeScript as first-class; they recommend generating types with `wrangler types` so your `Env` matches compatibility date/flags and **bindings**. ([Cloudflare Docs][18])

This matters a lot with Effect because you’ll likely have:

* `env.DB` (D1)
* `env.SOME_API_KEY` (vars/secrets)
* maybe `env.KV` (cache)
* maybe `env.R2` (uploads)

---

## Handling external APIs (your Python Droplet, etc.)

In Workers, requests come into `fetch(request, env, ctx)`, and you can use `ctx.waitUntil(...)` for background tasks (logging, async side effects) without delaying the response. ([Cloudflare Docs][4])

I’d model external calls as an Effect service layer, e.g.:

* `DropletClient` Layer (wraps `fetch`, handles auth, retries, timeouts, circuit breaking)
* optional caching layer (KV) for “read-mostly” endpoints

Then your API routes are just orchestration over services (clean, testable).

---

## Blogging “CMS” options that stay simple

### Baseline: Git-as-CMS (my recommendation)

* Posts are markdown/MDX in the repo.
* Editing happens via:

  * your editor locally, or
  * GitHub web editor + PRs
* Every PR gets a Pages preview URL automatically. ([Cloudflare Docs][14])
* Content shape is enforced by Astro Content Collections. ([Astro Documentation][2])

This gives you “content management” without adding another moving part.

### If you want an “admin UI” later

You can add a Git-backed CMS layer later (Keystatic / Decap / Tina-style) but I’d start with Git-as-CMS + previews because it’s extremely robust and low-maintenance.

---

## Where mini-apps fit

Treat mini-apps as first-class pages under something like:

* `/labs/*` (demos, sandboxes)
* `/projects/*` (case studies)
* `/apps/*` (interactive tools)

Each mini-app can:

* be fully static (no backend)
* use client-side calls to `/api/*`
* or use “server islands”/actions if you ever want selective on-demand rendering (Astro supports Cloudflare adapter features like server islands/actions/sessions when you go that route). ([Astro Documentation][19])

---

## Concrete “first build” plan

1. **Astro site**

* Create site + layout + blog routes.
* Add Content Collections schema + a couple MDX posts. ([Astro Documentation][2])

2. **D1 + migrations**

* Create a D1 DB (prod + preview).
* Add migrations folder + initial schema (e.g., `notes`, `demo_state`, etc.). ([Cloudflare Docs][15])

3. **Effect backend**

* Define an `HttpApi` for your mini-app endpoints.
* Back it with `@effect/sql-d1` via a `D1Client` Layer that uses `env.DB`. ([Effect Ts][10])
* Export a web handler using `HttpApiBuilder.toWebHandler(...)`. ([Effect Ts][5])

4. **Pages Advanced mode**

* Add build step to emit `dist/_worker.js` that routes `/api/*` to Effect and otherwise calls `env.ASSETS.fetch(request)`. ([Cloudflare Docs][1])

5. **GitHub → Pages**

* Connect repo with Pages Git integration.
* Enjoy preview deployments on PRs/branches. ([Cloudflare Docs][14])

---

If you want, I can also sketch:

* a minimal `worker/index.ts` structure (Effect Layers + D1Client + HttpApi)
* a suggested D1 schema that works well for “lots of tiny apps”
* a build script that reliably drops `_worker.js` into `dist/` (so Pages advanced mode “just works”)

…but the architecture above is the core “clean + robust + Effect-native” Cloudflare setup.

[1]: https://developers.cloudflare.com/pages/functions/advanced-mode/ "Advanced mode · Cloudflare Pages docs"
[2]: https://docs.astro.build/en/guides/content-collections/?utm_source=chatgpt.com "Content collections - Astro Docs"
[3]: https://docs.astro.build/en/guides/integrations-guide/mdx/?utm_source=chatgpt.com "astrojs/mdx - Astro Docs"
[4]: https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/ "Fetch Handler · Cloudflare Workers docs"
[5]: https://effect-ts.github.io/effect/platform/HttpApiBuilder.ts.html "HttpApiBuilder.ts - effect"
[6]: https://effect.website/docs/schema/introduction/ "Introduction to Effect Schema | Effect Documentation"
[7]: https://developers.cloudflare.com/d1/?utm_source=chatgpt.com "Overview · Cloudflare D1 docs"
[8]: https://developers.cloudflare.com/d1/worker-api/d1-database/?utm_source=chatgpt.com "D1 Database"
[9]: https://developers.cloudflare.com/d1/worker-api/d1-database/ "D1 Database · Cloudflare D1 docs"
[10]: https://effect-ts.github.io/effect/sql-d1/D1Client.ts.html "D1Client.ts - effect"
[11]: https://developers.cloudflare.com/pages/configuration/git-integration/ "Git integration · Cloudflare Pages docs"
[12]: https://developers.cloudflare.com/pages/functions/wrangler-configuration/ "Configuration · Cloudflare Pages docs"
[13]: https://developers.cloudflare.com/pages/functions/bindings/?utm_source=chatgpt.com "Bindings · Cloudflare Pages docs"
[14]: https://developers.cloudflare.com/pages/configuration/preview-deployments/ "Preview deployments · Cloudflare Pages docs"
[15]: https://developers.cloudflare.com/d1/reference/migrations/?utm_source=chatgpt.com "Migrations · Cloudflare D1 docs"
[16]: https://developers.cloudflare.com/d1/wrangler-commands/?utm_source=chatgpt.com "Wrangler commands - D1"
[17]: https://developers.cloudflare.com/d1/best-practices/local-development/?utm_source=chatgpt.com "Local development - D1"
[18]: https://developers.cloudflare.com/workers/languages/typescript/ "Write Cloudflare Workers in TypeScript · Cloudflare Workers docs"
[19]: https://docs.astro.build/en/guides/integrations-guide/cloudflare/?utm_source=chatgpt.com "astrojs/cloudflare - Astro Docs"

