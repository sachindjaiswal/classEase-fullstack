# ClassEase — Project Context Checkpoint

> **This file is the persistent checkpoint.** Read this first every session to re-establish
> project state. It records what exists, what has been verified, and how to run everything.
> Keep it in sync with reality after any significant change (new migrations, models, routes,
> Docker changes, or verified baseline updates). Last verified: **2026-08-19**.

## Project at a Glance

Two separate apps in one repo:

- **`classEase/`** — Laravel 13 backend with Inertia.js/React. Primary app. Runs on
  `http://localhost:8000` via `php artisan serve` (local SQLite `.env`).
- **`client/`** — Standalone React SPA (React Router, not Inertia). Runs on
  `http://localhost:5173`. Proxies `/api/*` to the Laravel backend (Vite dev server).
- **`docker/` + `docker-compose.yml`** — Full Dockerized stack (see Docker Setup).

## Git State

- Branch: `main`, HEAD: `68b3808` (`chore(baseline): Dockerized stack, standalone client, agent checkpoint, green baseline`).
- The green baseline is committed (75 files). Still untracked: `classEase/composer-setup.php`
  (Composer installer boilerplate, intentionally excluded).
- Prior HEAD was `aabc51e` (`database(subject): created the migrations and model for the subjects`).
- Commit style seen in history: `type(scope): message` (e.g. `fix(auth): ...`, `chore(setup): ...`).

## Verified Green Baseline (2026-08-19)

All of the following pass. **Run in this order.**

| Check | Command (from `classEase/`) | Status |
|---|---|---|
| JS lint | `npm run lint:check` | PASS |
| JS format | `npm run format:check` | PASS |
| JS types | `npm run types:check` | PASS |
| PHP lint | `& "C:\xampp\php\php.exe" vendor\bin\pint --test` | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | PASS |
| Tests | see "Running Tests" below | 3 passed (6 assertions) |
| Full-stack smoke | `docker compose up -d` + register/login/me/classes via :8080, client SPA + proxy via :5174 | PASS (2026-08-19) |

### Full-stack smoke test (2026-08-19)

With the whole stack up (mysql 3307, redis 6380, nginx 8080, client 5174):
- `GET http://localhost:8080/up` → Laravel "Application up" page.
- `POST /api/register` (name, email, password + password_confirmation, role) → user + Sanctum token.
- `GET /api/me` with `Authorization: Bearer <token>` → the user (auth:sanctum works).
- `GET /api/classes` with token → `{data: []}` (DB read through mysql works). **Note:** the
  `ClassEaseTestDataSeeder` was empty at that time — it was restored and re-seeded later (see "Seed data" below).
- `GET http://localhost:5174` → ClassEase SPA; `POST http://localhost:5174/api/login` → 422 (Vite proxy → nginx → Laravel chain works).

### Environment facts that make these commands non-trivial (Windows)

- PowerShell blocks `npm.ps1` → always call **`npm.cmd`**.
- `composer` is **not** on PATH. Local PHP is only `C:\xampp\php\php.exe` (**PHP 8.2.12**),
  too old for composer's platform check (`vendor/composer/platform_check.php` requires
  **PHP >= 8.3.0`). So `vendor/bin/phpstan` and `php artisan` **cannot run locally** —
  run them inside the Docker container.
- Pint is a standalone binary and **does** run on PHP 8.2: `& "C:\xampp\php\php.exe" vendor\bin\pint --parallel`.
- Port 3306 is occupied by XAMPP's MySQL → `docker compose up` with the mysql port mapping fails;
  tests don't need MySQL anyway (phpunit.xml = SQLite `:memory:`).

### Running Tests

Use the `phpverif` container (PHP 8.3, image `classease-app`). **Env overrides are mandatory**
— compose env vars (DB_CONNECTION=mysql) leak into the container, so force SQLite in-memory:

```
docker exec -e APP_ENV=testing -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: `
  -e QUEUE_CONNECTION=sync -e CACHE_STORE=array -e SESSION_DRIVER=array `
  -e MAIL_MAILER=array -e BROADCAST_CONNECTION=null phpverif php artisan test
```

Current tests: `tests/Unit/ExampleTest` (that true is true) and
`tests/Feature/ExampleTest` (login requires credentials → POST /api/login 422;
health check responds → GET /up 200).

## Docker Setup

Services (`docker-compose.yml` at repo root):

| Service | Container | Host port | Role |
|---|---|---|---|
| `mysql` | classease-mysql | **3307** | MySQL 8.0, DB `classease`, user `classease`/`secret`, root `rootsecret` |
| `redis` | classease-redis | **6380** | Cache, sessions, queue |
| `app` | classease-app | 9000 (internal) | Laravel PHP-FPM (build context `docker/php/Dockerfile`) |
| `queue` | classease-queue | — | `php artisan queue:work --sleep=3 --tries=3 --max-time=3600` |
| `client` | classease-client | **5174** | Vite dev server (build context `docker/client/Dockerfile`) |
| `nginx` | classease-nginx | **8080** | Reverse proxy → Laravel PHP-FPM |

> Host ports retuned 2026-08-19: XAMPP MySQL holds 3306, IIS holds 80, local Vite holds 5173.
> Inside the Docker network services still use standard ports (mysql:3306, redis:6379, nginx:80).

- `docker compose up --build` first run installs deps + builds assets automatically
  (`docker/php/entrypoint.sh`: creates `.env` from `.env.example` + APP_KEY if missing,
  `composer install` if `vendor/` empty, `npm install` + `npm run build` if `node_modules/` empty, then `exec "$@"`).
- **Named volumes** (`php-vendor`, `php-node-modules`, `client-node-modules`) keep Linux deps
  separate from the Windows host. Never mount host `vendor/`/`node_modules/`.
- Env vars in `docker-compose.yml` override `.env` (MySQL + Redis at runtime; no `.env` edit needed).
  APP_KEY is hardcoded in compose to match the local `.env`.
- `app` and `queue` share the `classease-app` image + `php-vendor` volume; `queue` uses `image: classease-app`,
  do NOT give it its own `build:`.
- `app` healthcheck is `kill -0 1` (PHP image has neither curl nor pgrep; php-fpm is pid 1).
- `client/vite.config.ts` reads `VITE_API_TARGET` for proxy target (default `http://localhost:8000`
  locally, `http://nginx` in Docker) and sets `host: '0.0.0.0'`.
- Network flow: Browser → `localhost:8080` (nginx) → `/api/*` → Laravel; `localhost:5174` (client)
  → `/api/*` proxied by Vite → `http://nginx` → Laravel.
- `.dockerignore` at repo root excludes vendor, node_modules, .env, git.

### Docker gotchas

- **`phpverif`** — a one-off container created for verification
  (`docker compose run --no-deps -d --name phpverif app`). It is running, entrypoint completed,
  `classease_php-vendor` volume populated. Used for PHPStan + artisan test. Recreate if missing
  with the same command (confirm entrypoint finishes before running phpstan).
- Local `.env` uses SQLite; Docker overrides to MySQL. Don't change local `.env` to MySQL.
- Ports 3306/6379/80/5173 must be free; local `php artisan serve` on 8000 doesn't conflict.
- Docker Desktop path: `C:\Program Files\Docker\Docker\Docker Desktop.exe` (daemon v29.4.0).

## Backend (Laravel 13, classEase/)

### Models — naming inconsistency is intentional, do not "fix"

- `User` — `app/Models/User.php`. fillable: name, email, password, **role**. Uses PHP attributes
  `#[Fillable]`/`#[Hidden]` (Laravel 12+ feature) + `$fillable`/`$hidden` arrays. `hasOne` Student, Teacher.
- `teacher.php` — **file is lowercase `teacher.php`**, class `Teacher`. `SoftDeletes`.
  snake_case columns: `first_name`, `middle_name`, `surname`, `contact`, `designation`,
  `monthly_salary` (int). `belongsTo` User; `hasMany` classes (via `class_teacher`), subjects (via `teacherId`).
- `classes.php` — **file lowercase `classes.php`**, class **`classes`** (lowercase). snake_case:
  `class_teacher` (nullable FK → teachers, nullOnDelete), `class_name`, `section`, `room_no`.
  `belongsTo` Teacher (via `class_teacher`); `hasMany` Subject (via `classId`).
- `Student` — `SoftDeletes`. **camelCase** columns: `classId` (FK → classes), `firstName`,
  `middleName`, `surname`, `contact`, `parentContact`, `address`. `user_id` unique FK → users.
  `belongsTo` User, classes.
- `Subject` — **camelCase**: `classId` (FK → classes), `subjectName`, `teacherId` (FK → teachers).
  `belongsTo` classes, Teacher. (Model `$hidden` lists `user_id` which doesn't exist on this table — known quirk, harmless.)

Relation generics are declared via PHPDoc `@return` tags using `$this` for the declaring model,
e.g. `@return HasMany<Subject, $this>`. **PHP 8.3/8.4 — never put generics in native signatures**
(parse error on PHP < 8.4).

`HasFactory` generic on User is declared as `/** @use HasFactory<UserFactory> */` **directly above
the `use HasFactory;` statement inside the class** (not in the class docblock — PHPStan 2.x only
reads the trait `@use` tag on the use-clause PHPDoc).

### Controllers (all now PHPStan-clean, typed `int $id`, JsonResponse returns)

- `AuthController` — `register`, `login`, `me`, `logout` (Sanctum token auth).
- `ClassesController` — `getAllClasses`, `getClass`, `createClass`, `updateClass`, `deleteClass`.
- `StudentController` — `addStudent`, `getStudent`, `getAllStudentFromClass`.
- `TeacherController` — `getAllTeachers`, `getTeacher`, `createTeacher`, `updateTeacher`, `deleteTeacher`.
- `SubjectController` — currently empty (subjects feature not built yet).
- `Resources/ClassesResource.php` — has `@property-read` docblock.

### Routes

- `routes/api.php` — public: `POST /api/login`, `POST /api/register`. Rest under `auth:sanctum`:
  `/me`, `/logout`, `/classes` (GET/POST), `/classes/{id}` (GET/PUT/DELETE), `/students` (POST),
  `/student/{id}` (GET), `/student/class/{id}` (GET), teachers GET/POST/PUT/DELETE.
- **Singular/plural inconsistency (do NOT "fix" without fixing the client too):**
  `POST /students` (plural) but `GET /student/{id}` and `GET /student/class/{id}` (singular).
- `routes/web.php` — only `/student-form` view (plus removed unused AuthController import).
- `bootstrap/app.php` — health check at `/up`.

### Migrations (10)

`users`, `cache`, `jobs`, `teachers`, `classes`, `students`, `personal_access_tokens`,
`subjects`, plus 2 new: `add_email_to_teachers`, `add_email_password_to_students`
(both untracked). Columns per model above; teachers/students use `softDeletes`.

### Factories / Seeders

- `UserFactory` — for User (updated).
- `ClassEaseTestDataSeeder` + `DatabaseSeeder` — seed Users (students/teachers/admin) + classes.

### Test accounts (password for all: `ClassEase@123`)

| Role | Email |
|---|---|
| admin | `admin@classease.com` |
| teacher | `teacher1@classease.com`, `teacher2@classease.com`, `teacher3@classease.com` |
| student | `student1@classease.com` … `student6@classease.com` |

Seeder is `updateOrCreate`-based (idempotent). Note: `teachers.email`, `students.email`,
`students.password` are NOT NULL — any future edits to the seeder must set them.

## Frontend

- **classEase (Inertia)**: React 19, Tailwind v4 (Vite plugin, CSS-first), laravel-vite-plugin.
  React Compiler via Babel. Wayfinder-generated files (`resources/js/actions/`, `routes/`,
  `wayfinder/`) are gitignored — never commit.
- **client (standalone)**: React 18, Tailwind v3.4 (PostCSS + JS config, custom theme colors
  ink/gold/base/surface/border, fonts Space Grotesk + IBM Plex). Has `src/api` axios layer
  (baseURL `/api`, Bearer token interceptor), `types`, `AppRouter` with role guards
  (management/teacher/student), `AuthContext`. **No lint/format/typecheck scripts** — only
  `dev`, `build`, `preview`.

## Code Style

- PHP: Pint, Laravel preset. `pint.json` excludes `composer-setup.php`.
- JS/TS (classEase only): ESLint + Prettier, 4-space indent, single quotes, `curly: always`,
  `import type { X }` for types, ordered imports. `.editorconfig` in classEase/.
- No comments unless asked. Model generics live in PHPDoc (see Models above).

## Known Open Items / Next Steps

- Subjects: `SubjectController` empty, no API routes for subjects, subject views not built.
- Wayfinder routes must be regenerated (`npm run build` / wayfinder:generate) after route changes.
- Optionally clean up the `phpverif` one-off container when no longer needed
  (`docker rm -f phpverif`).