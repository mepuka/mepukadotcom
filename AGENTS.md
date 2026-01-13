# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Summary

Personal website: Astro static frontend + Effect edge backend on Cloudflare Pages.

- **Frontend**: Astro 5, MDX blog, Content Collections
- **Backend**: Effect with HttpApi on Cloudflare Workers
- **Database**: Cloudflare D1 (when enabled)
- **Package Manager**: bun (preferred) or npm

## Build & Test Commands

```bash
# Install dependencies
bun install

# Development
bun run dev                    # Astro dev server on localhost:4321

# Build
bun run build                  # Build Astro + worker to dist/

# Test
bun run test                   # Run all tests
bun run test:watch             # Watch mode

# Preview production build locally
bun run preview                # Runs wrangler pages dev
```

## Project Structure

```
src/
  pages/                       # Astro pages (.astro files)
  layouts/                     # Layout components
  components/                  # Reusable components
  content/blog/                # MDX blog posts
  content.config.ts            # Content Collections schema
  styles/global.css            # Design system CSS variables

worker/
  index.ts                     # Effect backend entry point
  services/                    # Effect service layers
  api/                         # HttpApi definitions
  domain/                      # Effect Schema definitions

scripts/
  build-worker.ts              # Bundles worker to dist/_worker.js

dist/                          # Build output (generated)
```

## Code Style

### TypeScript
- Strict mode enabled
- Use Effect patterns (Effect.gen, Effect.fn, Context.Tag, Layer)
- Brand domain primitives with Schema (IDs, emails, etc.)
- Use Schema.TaggedError for domain errors

### Astro/Frontend
- Components in `src/components/`
- Layouts in `src/layouts/`
- CSS variables defined in `src/styles/global.css`
- Follow existing typography and color system

### Commit Messages
- Concise, imperative mood ("Add feature" not "Added feature")
- Include `Co-Authored-By: <agent-name>` when applicable

## Effect Reference Source

The Effect repository is cloned locally for reference:

```
~/.local/share/effect-solutions/effect/
```

Use this to:
- Explore API implementations in `packages/effect/src/`
- Find usage patterns in `packages/*/test/`
- Understand HttpApi in `packages/platform/src/`
- Reference SQL patterns in `packages/sql-d1/src/`

When implementing Effect patterns, grep this source for real examples rather than guessing syntax.

## Boundaries

### Do Not Modify
- `dist/` - Generated build output
- `node_modules/` - Dependencies
- `.wrangler/` - Cloudflare local state
- Files outside the project root

### Do Not Commit
- `.env` files or secrets
- API keys or credentials
- Large binary files

### Security
- Never expose secrets in client-side code
- Validate all API inputs with Effect Schema
- Use `Config.redacted()` for sensitive config values

## Testing Guidelines

- Use `@effect/vitest` for Effect code
- `it.effect()` for standard Effect tests
- `it.scoped()` for tests with resources
- Provide test layers to isolate dependencies

## Deployment

- Push to `main` branch triggers auto-deploy via Cloudflare Pages
- Site: https://mepuka.com
- Preview deployments for PRs

## Additional Context

For Claude Code specifically, see `CLAUDE.md` for detailed Effect patterns and examples.
