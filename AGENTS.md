# ClassEase — Agent Instructions

## Resume Protocol

**At the start of every session, do this before anything else:**

1. **Read `PROJECT_CONTEXT.md`** at the repo root — it is the persistent checkpoint and holds
   the full verified project snapshot (git state, baseline results, schema, routes, Docker details).
   Treat its "Verified Green Baseline" as ground truth for the current state.
2. **Do NOT re-explore or re-verify everything** — only explore areas the task touches.
3. **After any significant change** (new migration/model/route, controller edits, Docker changes),
   re-run the baseline in the Verification Order below so the snapshot stays truthful, and update
   `PROJECT_CONTEXT.md` to match reality.
4. **Environment shortcuts** (see PROJECT_CONTEXT.md for the full story):
   - `composer`/`npm.ps1` blocked → use `npm.cmd`; local PHP 8.2 only runs Pint
   - PHPStan + `php artisan test` run inside the `phpverif` Docker container (PHP 8.3)
   - Tests need explicit SQLite in-memory env overrides (see PROJECT_CONTEXT.md)

## Project Structure

Two separate apps in one repo:

- **`classEase/`** — Laravel 13 backend with Inertia.js/React. Primary app. Runs on `http://localhost:8000` via `php artisan serve`.
- **`client/`** — Standalone React SPA (React Router, not Inertia). Runs on `http://localhost:5173`. Proxies `/api/*` to the Laravel backend.
- **`docker/` + `docker-compose.yml`** — Full Dockerized stack (see Docker Setup below).

## Key Commands

All commands below run from `classEase/`:

```
composer setup          # Full setup: composer install, key gen, migrate, npm install, npm build
composer ci:check       # Full CI: JS lint + format + typecheck, then PHP lint + stan + test
composer test           # Config clear, pint lint, phpstan, artisan test
composer lint           # PHP lint via Pint (pint --parallel)
composer lint:check     # PHP lint check only (no auto-fix)
composer types:check    # PHPStan level 7
npm run lint:check      # ESLint check
npm run format:check    # Prettier check
npm run types:check     # TypeScript check (tsc --noEmit)
```

From `client/`:
```
npm install             # Install deps
npm run dev             # Start Vite dev server (proxies /api to localhost:8000)
npm run build           # Production build (tsc + vite build)
```

**Client has no lint, format, or typecheck scripts.** Only `dev`, `build`, and `preview` exist.

## Docker Setup

Full stack runs via Docker (created 2026-08-19). Services are defined in `docker-compose.yml` at repo root:

| Service | Container | Host port | Role |
|---|---|---|---|
| `mysql` | classease-mysql | 3306 | MySQL 8.0, DB `classease`, user `classease`/`secret`, root `rootsecret` |
| `redis` | classease-redis | 6379 | Cache, sessions, queue |
| `app` | classease-app | 9000 (internal) | Laravel PHP-FPM (build context: `docker/php/Dockerfile`) |
| `queue` | classease-queue | — | `php artisan queue:work --sleep=3 --tries=3 --max-time=3600` |
| `client` | classease-client | 5173 | Vite dev server (build context: `docker/client/Dockerfile`) |
| `nginx` | classease-nginx | 80 | Reverse proxy → Laravel PHP-FPM |

```
docker compose up --build    # First run (installs deps, builds assets automatically)
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed
docker compose logs -f app
```

**Startup flow**: `app` waits on `mysql`+`redis` healthchecks; `queue` and `nginx` wait on `app` healthy. `docker/php/entrypoint.sh` runs on container start: creates `.env` from `.env.example` + generates APP_KEY (only if missing), runs `composer install` if `vendor/` empty, runs `npm install` + `npm run build` if `node_modules/` empty, then `exec "$@"` (php-fpm or the queue command).

**Key Docker design decisions**:
- **Env vars in `docker-compose.yml` override `.env`** — DB switches to MySQL + Redis at runtime; no `.env` edit needed. APP_KEY is hardcoded in compose (matches the local `.env` value).
- **Named volumes** (`php-vendor`, `php-node-modules`, `client-node-modules`) keep Linux-compatible deps separate from the Windows host — never mount the host's `vendor/`/`node_modules/` into containers.
- **`app` and `queue` share the `classease-app` image and the `php-vendor` volume**. `queue` uses `image: classease-app` — don't give it its own `build:`.
- **Network flow**: Browser → `localhost:80` (nginx) → `/api/*` → Laravel; `localhost:5173` (client) → `/api/*` proxied by Vite → `http://nginx` → Laravel.
- **`client/vite.config.ts`** reads `VITE_API_TARGET` env var for its proxy target — defaults to `http://localhost:8000` locally, set to `http://nginx` inside the client container. Also sets `host: '0.0.0.0'` so Vite is reachable from Docker.
- **Dockerfiles are dev-oriented**: deps installed at container start into named volumes (not baked into the image), so code changes via volume mounts are live. Rebuild only needed when system packages/PHP extensions change.
- `.dockerignore` at repo root excludes `vendor`, `node_modules`, `.env`, git — build context is repo root (`.`).

**Docker gotchas**:
- Local `.env` uses SQLite; Docker env vars override to MySQL. Don't change the local `.env` to MySQL unless you also run locally via `php artisan serve` (that would then require a local MySQL).
- The `app` healthcheck uses `pgrep php-fpm` (no curl in the PHP image).
- Ports 3306/6379/80/5173 must be free — local `php artisan serve` uses 8000 which does not conflict.

## Verification Order

Run checks in this order:
1. `npm run lint:check` (JS/TS lint)
2. `npm run format:check` (JS/TS format)
3. `npm run types:check` (JS/TS types)
4. `composer lint:check` (PHP lint)
5. `composer types:check` (PHPStan)
6. `composer test` (config clear → pint → phpstan → artisan test — full pre-commit check)

There is no CI workflow. `.github/` does not exist.

## Architecture

- **Backend routes**: `classEase/routes/web.php` and `classEase/routes/api.php`
- **API routes** use `auth:sanctum` middleware
- **Frontend entry**: `classEase/resources/js/app.tsx` (Inertia) and `client/src/main.tsx` (standalone React)
- **Wayfinder** generates typed routes — files in `resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/` are auto-generated and gitignored
- **React Compiler** is enabled via Babel plugin in the Inertia app
- **`.npmrc`** in `classEase/` sets `ignore-scripts=true` (security). Client has no `.npmrc`.

## Version Differences Between Apps

| | classEase (Inertia) | client (standalone) |
|---|---|---|
| React | ^19.2.0 | ^18.3.1 |
| Tailwind | ^4.0.0 (Vite plugin, CSS-first config) | ^3.4.15 (PostCSS + JS config) |
| Build | laravel-vite-plugin + Inertia | Plain Vite + React |
| Lint/Format | ESLint + Prettier configured | **None configured** |

Client's Tailwind v3 config (`client/tailwind.config.js`) defines custom theme colors (ink, gold, base, surface, border) and fonts (Space Grotesk, IBM Plex Sans/Mono).

## Testing

- **PHP**: Pest (PHPUnit-based), tests in `tests/Unit` and `tests/Feature`, SQLite in-memory for testing
- **Client**: No tests

## Code Style

- PHP: Pint with Laravel preset
- JS/TS (classEase only): ESLint + Prettier, 4-space indent, single quotes, `curly: always`
- Type imports enforced: `import type { X }` (separate style)
- Import order: builtin → external → internal → parent → sibling → index (alphabetical)
- `.editorconfig` exists in `classEase/` (utf-8, lf, 4-space indent, trim trailing whitespace)

## Known Gotchas

- **Route singular/plural inconsistency**: `routes/api.php` uses `POST /students` (plural) but `GET /student/{id}` and `GET /student/class/{id}` (singular). Client calls match the singular form — don't "fix" the client without also fixing the route.
- **Field naming inconsistency**: `Student` and `Subject` use camelCase (`firstName`, `classId`, `subjectName`), while `Teacher`/`Classes` use snake_case (`first_name`, `class_teacher`). This affects both DB columns and model attributes.
- **Wayfinder-generated files** (`resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/`) are gitignored — do not commit
- **`composer test`** runs multiple steps (config clear → pint → phpstan → artisan test) — it's the full pre-commit check
- **`composer-setup.php`** in `classEase/` is standard Composer installer boilerplate, not a project setup script
