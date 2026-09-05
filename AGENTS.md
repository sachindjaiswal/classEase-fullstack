# ClassEase — Agent Instructions

## Resume Protocol

**At the start of every session, do this before anything else:**

1. **Read `PROJECT_CONTEXT.md`** at the repo root — it is the persistent verified snapshot (git state, baseline results, schema, routes, Docker details). Treat its "Verified Green Baseline" as ground truth.
2. **Do NOT re-explore or re-verify everything** — only explore areas the task touches.
3. **After any significant change** (new migration/model/route, Docker changes), re-run the baseline in the Verification Order below so the snapshot stays truthful, and update `PROJECT_CONTEXT.md` to match reality.
4. **Environment shortcuts** (see PROJECT_CONTEXT.md):
   - `npm.ps1` blocked → always use `npm.cmd`
   - PHPStan + `php artisan test` run inside the `phpverif` Docker container (PHP 8.3)
   - Tests need explicit SQLite in-memory env overrides (see PROJECT_CONTEXT.md)

## Project Structure

Two separate apps in one repo:

- **`classEase/`** — Laravel 13 backend with Inertia.js/React. Primary app. Runs on `http://localhost:8000` via `php artisan serve` (local SQLite `.env`).
- **`client/`** — Standalone React SPA (React Router, not Inertia). Runs on `http://localhost:5173`. Proxies `/api/*` to the Laravel backend.
- **`docker/` + `docker-compose.yml`** — Full Dockerized stack.

## Key Commands

All commands below run from `classEase/` unless noted:

```
composer setup          # Full setup: composer install, key gen, migrate, npm install, npm build
composer ci:check       # Full CI: JS lint + format + typecheck, then PHP test (no pint/phpstan standalone)
composer test           # Config clear → pint:check → phpstan → artisan test — full pre-commit check
composer lint           # PHP lint via Pint (pint --parallel)
composer lint:check     # PHP lint check only (no auto-fix, pint --parallel --test)
composer types:check    # PHPStan level 7 (phpstan analyse)
npm run lint:check      # ESLint check (classEase only)
npm run format:check    # Prettier check (classEase only)
npm run types:check     # tsc --noEmit (classEase only)
```

From `client/`:
```
npm install             # Install deps
npm run dev             # Start Vite dev server (proxies /api to localhost:8000)
npm run build           # Production build (tsc + vite build)
```

**Client has no lint, format, or typecheck scripts.** Only `dev`, `build`, and `preview` exist.

## Docker Setup

Full stack runs via Docker (services in `docker-compose.yml` at repo root):

| Service | Host port | Role |
|---|---|---|
| `mysql` | **3307** | MySQL 8.0, DB `classease`, user `classease`/`secret` |
| `redis` | **6380** | Cache, sessions, queue |
| `app` | 9000 (internal) | Laravel PHP-FPM |
| `queue` | — | `php artisan queue:work --sleep=3 --tries=3 --max-time=3600` |
| `client` | **5174** | Vite dev server |
| `nginx` | **8080** | Reverse proxy → Laravel PHP-FPM |

> **Host ports retuned 2026-08-19**: XAMPP MySQL on 3306, IIS on 80, local Vite on 5173. Inside Docker network, services use standard ports (mysql:3306, redis:6379, nginx:80).

```
docker compose up -d --build    # First run: installs deps + builds assets automatically
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed
```

**Startup flow**: `app` waits on `mysql`+`redis` healthchecks; `queue` and `nginx` wait on `app` healthy.

**Key design decisions**:
- Env vars in `docker-compose.yml` override `.env` (DB → MySQL + Redis at runtime; no `.env` edit needed). APP_KEY is hardcoded in compose (matches local `.env`).
- Named volumes (`php-vendor`, `php-node-modules`, `client-node-modules`) keep Linux deps separate from Windows host — never mount host `vendor/`/`node_modules/`.
- `app` and `queue` share the `classease-app` image + `php-vendor` volume; `queue` uses `image: classease-app` — do NOT give it its own `build:`.
- `app` healthcheck is `kill -0 1` (PHP image has neither curl nor pgrep; php-fpm is pid 1).
- `client/vite.config.ts` reads `VITE_API_TARGET` env var (default `http://localhost:8000` locally, `http://nginx` in Docker). Sets `host: '0.0.0.0'` so Vite is reachable from Docker.
- Network flow: Browser → `localhost:8080` (nginx) → `/api/*` → Laravel; `localhost:5174` (client) → `/api/*` proxied by Vite → `http://nginx` → Laravel.
- `.dockerignore` at repo root excludes vendor, node_modules, .env, git.

**Docker gotchas**:
- Local `.env` uses SQLite; Docker overrides to MySQL. Don't change local `.env` to MySQL unless you also run locally via `php artisan serve`.
- The `app` healthcheck is `kill -0 1` (PHP image has neither curl nor pgrep; php-fpm runs as pid 1).
- Host ports 3307/6380/8080/5174 are mapped ones — 3306/6379/80/5173 are taken by local services (XAMPP MySQL, IIS, local Vite). The local standalone client on 5173 proxies to `http://localhost:8000`, which requires a backend there (local `php artisan serve` is impossible on PHP 8.2).
- `phpverif` is a one-off container (`docker compose run --no-deps -d --name phpverif app`) used for PHPStan + artisan test. Recreate if missing with the same command.

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
- **Wayfinder** generates typed routes — files in `resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/` are auto-generated and gitignored — **do not commit**
- **React Compiler** is enabled via Babel plugin in the Inertia app
- **`.npmrc`** in `classEase/` sets `ignore-scripts=true` (security). Client has no `.npmrc`.

## Version Differences Between Apps

| | classEase (Inertia) | client (standalone) |
|---|---|---|
| React | ^19.2.0 | ^18.3.1 |
| Tailwind | ^4.0.0 (Vite plugin, CSS-first) | ^3.4.15 (PostCSS + JS config) |
| Build | laravel-vite-plugin + Inertia | Plain Vite + React |
| Lint/Format | ESLint + Prettier configured | **None configured** |

Client's Tailwind v3 config (`client/tailwind.config.js`) defines custom theme colors (ink, gold, base, surface, border) and fonts (Space Grotesk, IBM Plex Sans/Mono).

## Testing

- **PHP**: Pest (PHPUnit-based), tests in `tests/Unit` and `tests/Feature`, SQLite in-memory for testing
- **Client**: No tests

**Running tests**: Use the `phpverif` container (PHP 8.3). Force SQLite in-memory with env overrides:

```
docker exec -e APP_ENV=testing -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: `
  -e QUEUE_CONNECTION=sync -e CACHE_STORE=array -e SESSION_DRIVER=array `
  -e MAIL_MAILER=array -e BROADCAST_CONNECTION=null phpverif php artisan test
```

Current tests: `tests/Unit/ExampleTest` (true is true) and `tests/Feature/ExampleTest` (login requires credentials → POST /api/login 422; health check → GET /up 200).

## Code Style

- PHP: Pint with Laravel preset
- JS/TS (classEase only): ESLint + Prettier, 4-space indent, single quotes, `curly: always`, `import type { X }` for types, ordered imports
- `.editorconfig` exists in `classEase/` (utf-8, lf, 4-space indent, trim trailing whitespace)

## Known Gotchas

- **Route singular/plural inconsistency**: `routes/api.php` uses `POST /students` (plural) but `GET /student/{id}` and `GET /student/class/{id}` (singular). Client calls match the singular form — don't "fix" the client without also fixing the route.
- **Field naming inconsistency**: `Student` and `Subject` use camelCase (`firstName`, `classId`, `subjectName`), while `Teacher`/`Classes` use snake_case (`first_name`, `class_teacher`). This affects both DB columns and model attributes.
- **Wayfinder-generated files** (`resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/`) are gitignored — do not commit.
- **`composer test`** runs multiple steps (config clear → pint → phpstan → artisan test) — it's the full pre-commit check.
- **`composer-setup.php`** in `classEase/` is standard Composer installer boilerplate, not a project setup script.
- **Subjects**: `SubjectController` empty, no API routes for subjects, subject views not built.
- **Wayfinder routes** must be regenerated (`npm run build` / wayfinder:generate) after route changes.
- **Optionally clean up the `phpverif` one-off container** when no longer needed (`docker rm -f phpverif`).