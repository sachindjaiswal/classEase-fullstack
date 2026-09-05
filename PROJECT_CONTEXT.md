# ClassEase — Project Context Checkpoint

> **This file is the persistent checkpoint.** Read this first every session to re-establish
> project state. It records what exists, what has been verified, and how to run everything.
> Keep it in sync with reality after any significant change (new migrations, models, routes,
> Docker changes, or verified baseline updates). Last verified: **2026-09-05**.

## Project at a Glance

Two separate apps in one repo:

- **`classEase/`** — Laravel 13 backend with Inertia.js/React. Primary app. Runs on
  `http://localhost:8000` via `php artisan serve` (local SQLite `.env`).
- **`client/`** — Standalone React SPA (React Router, not Inertia). Runs on
  `http://localhost:5173`. Proxies `/api/*` to the Laravel backend (Vite dev server).
- **`docker/` + `docker-compose.yml`** — Full Dockerized stack (see Docker Setup).

## Git State

- Branch: `main`, HEAD: `46f0e0f` (**merge commit** — parents `c4cc595` + `bc87c2a`).
- `46f0e0f` integrates `origin/main`'s `bc87c2a` (`feat(subject): subjects CRUD + teacher/student subject routes`)
  into local main. The 4 conflicted files (StudentController, SubjectController, TeacherController,
  routes/api.php) were resolved in the working tree and committed with the merge. The local
  TeacherController fix (`use App\Models\Subject;`) is folded into this merge commit.
- Branch no longer diverged from `origin/main` (bc87c2a is now an ancestor of HEAD).
- Still untracked (intentionally): `classEase/composer-setup.php`, plus all work from
  (2026-09-04/2026-09-05) not yet committed (attendance, homework, dashboards, subjects
  pages, teacher/student subject views). Also `routes/api.php.tmp` + `run.txt` (junk, untracked).

## Verified Green Baseline (2026-08-19, updated 2026-09-03)

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
- `Attendance` — `student_id` (FK → students), `class_id` (FK → classes), `date` (date), `status` (enum: present/absent/late), `marked_by` (nullable FK → teachers), `remarks` (nullable). Unique constraint on (`student_id`, `date`). `belongsTo` Student, classes, marker (Teacher).
- `Homework` — `class_id` (FK → classes), `subject_id` (FK → subjects), `assigned_by` (FK → teachers), `title`, `description` (nullable), `assigned_date` (date), `due_date` (date). `belongsTo` classes, Subject, Teacher.

Relation generics are declared via PHPDoc `@return` tags using `$this` for the declaring model,
e.g. `@return HasMany<Subject, $this>`. **PHP 8.3/8.4 — never put generics in native signatures**
(parse error on PHP < 8.4).

`HasFactory` generic on User is declared as `/** @use HasFactory<UserFactory> */` **directly above
the `use HasFactory;` statement inside the class** (not in the class docblock — PHPStan 2.x only
reads the trait `@use` tag on the use-clause PHPDoc).

### Controllers

- `AuthController` — `register`, `login`, `me`, `logout` (Sanctum token auth).
- `ClassesController` — `getAllClasses`, `getClass`, `createClass`, `updateClass`, `deleteClass`.
- `StudentController` — `addStudent`, `getStudent`, `getAllStudentFromClass`, `getStudentSubjects`,
  `updateStudent`, `deleteStudent`. `getStudent` returns `{message, student}`.
  `addStudent` returns `{message, student}` with 201 status.
- `TeacherController` — `getAllTeachers`, `getTeacher`, `createTeacher`, `updateTeacher`, `deleteTeacher`.
- `SubjectController` — `getAllSubjects`, `getSubject`, `createSubject`, `updateSubject`, `deleteSubject`.
- `DashboardController` — `getStats` (returns teacher/student/class/subject counts).
- `AttendanceController` — `markAttendance` (bulk), `getAttendanceByClass`, `getStudentAttendance`, `updateAttendance`.
- `HomeworkController` — `createHomework`, `getHomework`, `updateHomework`, `deleteHomework`, `getHomeworkByClass`, `getHomeworkByStudent`.
- `Resources/ClassesResource.php` — has `@property-read` docblock.

### Routes

- `routes/api.php` — public: `POST /api/login`, `POST /api/register`. Rest under `auth:sanctum`:
  `/me`, `/logout`, `/dashboard/stats`, `/classes` (GET/POST/PUT/DELETE), `/students` (POST),
  `/student/{id}` (GET/PUT/DELETE), `/student/class/{id}` (GET), `/student/{id}/subjects` (GET),
  `/teachers` (GET/POST/PUT/DELETE), `/subjects` (GET/POST/PUT/DELETE),
  `/attendance` (POST), `/attendance/class` (GET), `/attendance/student/{id}` (GET), `/attendance/{id}` (PUT),
  `/homework` (POST), `/homework/{id}` (GET/PUT/DELETE), `/homework/class/{classId}` (GET), `/homework/student/{studentId}` (GET).
- **Singular/plural inconsistency (do NOT "fix" without fixing the client too):**
  `POST /students` (plural) but `GET /student/{id}` and `GET /student/class/{id}` (singular).
- `routes/web.php` — only `/student-form` view (plus removed unused AuthController import).
- `bootstrap/app.php` — health check at `/up`.

### Migrations (12)

`users`, `cache`, `jobs`, `teachers`, `classes`, `students`, `personal_access_tokens`,
`subjects`, `add_email_to_teachers`, `add_email_password_to_students`
(both untracked), `attendances`, `homeworks`. Columns per model above; teachers/students use `softDeletes`.

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

### Client page structure (as of 2026-09-04)

- **Auth**: `Login.tsx`, `Register.tsx` — `AuthContext` (login, register, logout, me).
- **Management** (role: management):
  - `Dashboard.tsx` — stats cards (Teachers, Students, Classes, Subjects counts with icons)
  - `Teachers/TeacherList.tsx` — list with Edit/Delete
  - `Teachers/AddTeacher.tsx` — create form
  - `Teachers/EditTeacher.tsx` — edit form
  - `Teachers/TeacherSubjects.tsx` — view a teacher's subjects
  - `Classes/ClassList.tsx` — list with Edit/Delete
  - `Classes/ClassForm.tsx` — create/edit form (combined)
  - `Students/StudentsByClass.tsx` — browse by class with Edit/Delete
  - `Students/AddStudent.tsx` — create form
  - `Students/EditStudent.tsx` — edit form
  - `Students/StudentSubjects.tsx` — view a student's subjects
  - `Subjects/SubjectList.tsx` — list with Edit/Delete
  - `Subjects/SubjectForm.tsx` — create/edit form (combined)
  - `Attendance/MarkAttendance.tsx` — select class + date, mark present/absent/late per student, save
  - `Attendance/ViewAttendance.tsx` — view attendance records by class + date
  - `Homework/HomeworkList.tsx` — list homework by class with Edit/Delete
  - `Homework/AddHomework.tsx` — create homework form (class, subject, title, dates)
  - `Homework/EditHomework.tsx` — edit homework form
- **Teacher** (role: teacher): `Dashboard.tsx` — teacher info card + subjects list
- **Student** (role: student): `Dashboard.tsx` — student info + class card + subjects list
- **Shared**: `Sidebar.tsx` (role-based nav links), `DashboardLayout.tsx`, `Button.tsx`, `StatusBadge.tsx`, `PlaceholderPage.tsx`
- **API layer**: `api/axios.ts`, `api/classes.ts`, `api/students.ts`, `api/teachers.ts`, `api/subjects.ts`, `api/dashboard.ts`, `api/attendance.ts`, `api/homework.ts`
- **Types**: `types/index.ts` (Role, User, Teacher, SchoolClass, ClassInput, Student, StudentInput, StudentClassSummary, Subject, SubjectInput, TeacherSummary, ClassSummary, SubjectFull, DashboardStats, AttendanceStatus, AttendanceItem, AttendancePayload, AttendanceRecord, AttendanceSummary, Homework, HomeworkInput)

### Sidebar nav links (management)

Dashboard, Students, Teachers, Classes, **Subjects**, **Attendance**, **Homework** (Subjects added 2026-09-03, Attendance added 2026-09-04, Homework added 2026-09-04).

## Code Style

- PHP: Pint, Laravel preset. `pint.json` excludes `composer-setup.php`.
- JS/TS (classEase only): ESLint + Prettier, 4-space indent, single quotes, `curly: always`,
  `import type { X }` for types, ordered imports. `.editorconfig` in classEase/.
- No comments unless asked. Model generics live in PHPDoc (see Models above).

## Work Completed (2026-09-03)

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `app\Http\Controllers\SubjectController.php` | Resolved merge conflict (`<<<<<<< HEAD` / `=======` / `>>>>>>> bc87c2a5...`), restored `use App\Models\Subject; use Illuminate\Http\Request;` | Fix |
| `app\Http\Controllers\StudentController.php` | Added `updateStudent()` and `deleteStudent()` methods; fixed `getStudent()` to return `{message, student}`; fixed `addStudent()` to return `{message, student}` with 201 | Feature |
| `routes/api.php` | Added `PUT /student/{id}` and `DELETE /student/{id}` routes | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\subjects.ts` | Created — CRUD API functions for subjects | Feature |
| `src\types\index.ts` | Added `Subject`, `SubjectInput`, `TeacherSummary`, `ClassSummary`, `SubjectFull` types | Feature |
| `src\pages\management\Subjects\SubjectList.tsx` | Created — subject list with Edit/Delete buttons | Feature |
| `src\pages\management\Subjects\SubjectForm.tsx` | Created — add/edit form (combined, like ClassForm) | Feature |
| `src\routes\AppRouter.tsx` | Added `EditTeacher`, `EditStudent`, `SubjectList`, `SubjectForm` imports and routes | Feature |
| `src\components\Sidebar.tsx` | Added Subjects link under management | Feature |
| `src\pages\management\Teachers\TeacherList.tsx` | Added Edit button and `useNavigate` import | Feature |
| `src\pages\management\Teachers\EditTeacher.tsx` | Created — edit form (mirrors AddTeacher) | Feature |
| `src\api\students.ts` | Added `updateStudent()` and `deleteStudent()` functions | Feature |
| `src\pages\management\Students\StudentsByClass.tsx` | Added Edit/Delete buttons to table, `handleDelete` function, `useNavigate` | Feature |
| `src\pages\management\Students\EditStudent.tsx` | Created — edit form (mirrors AddStudent) | Feature |

## Work Completed (2026-09-04)

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `app\Http\Controllers\DashboardController.php` | Created — `getStats()` returns teacher/student/class/subject counts | Feature |
| `app\Models\Attendance.php` | Created — attendance model with student/class/date/status/remarks | Feature |
| `app\Http\Controllers\AttendanceController.php` | Created — markAttendance (bulk), getAttendanceByClass, getStudentAttendance, updateAttendance | Feature |
| `database\migrations\2026_09_04_000001_create_attendances_table.php` | Created — attendances table with student_id, class_id, date, status, marked_by, remarks | Feature |
| `app\Models\Homework.php` | Created — homework model with class_id, subject_id, assigned_by, title, description, dates | Feature |
| `app\Http\Controllers\HomeworkController.php` | Created — createHomework, getHomework, updateHomework, deleteHomework, getHomeworkByClass, getHomeworkByStudent | Feature |
| `database\migrations\2026_09_04_000002_create_homeworks_table.php` | Created — homeworks table with FKs to classes, subjects, teachers | Feature |
| `routes/api.php` | Added dashboard stats, attendance (4 routes), homework (6 routes) | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\dashboard.ts` | Created — `getDashboardStats()` API function | Feature |
| `src\api\attendance.ts` | Created — markAttendance, getAttendanceByClass, getStudentAttendance, updateAttendance | Feature |
| `src\api\homework.ts` | Created — createHomework, getHomework, updateHomework, deleteHomework, getHomeworkByClass, getHomeworkByStudent | Feature |
| `src\types\index.ts` | Added DashboardStats, Attendance types (5), Homework types (2) | Feature |
| `src\pages\management\Dashboard.tsx` | Replaced placeholder with stats cards (Teachers, Students, Classes, Subjects counts with icons) | Feature |
| `src\pages\teacher\Dashboard.tsx` | Replaced placeholder with teacher info card + subjects list | Feature |
| `src\pages\student\Dashboard.tsx` | Replaced placeholder with student info + class card + subjects list | Feature |
| `src\pages\management\Attendance\MarkAttendance.tsx` | Created — select class + date, mark present/absent/late per student, save | Feature |
| `src\pages\management\Attendance\ViewAttendance.tsx` | Created — view attendance records by class + date with status badges | Feature |
| `src\pages\management\Homework\HomeworkList.tsx` | Created — list homework by class with Edit/Delete, overdue indicator | Feature |
| `src\pages\management\Homework\AddHomework.tsx` | Created — create homework form (class, subject filter, title, dates) | Feature |
| `src\pages\management\Homework\EditHomework.tsx` | Created — edit homework form | Feature |
| `src\api\teachers.ts` | Added `getTeacherSubjects()` function | Feature |
| `src\api\students.ts` | Added `getStudentSubjects()` function | Feature |
| `src\routes\AppRouter.tsx` | Added attendance + homework routes | Feature |
| `src\components\Sidebar.tsx` | Added Attendance + Homework links | Feature |
| `src\pages\management\Teachers\TeacherList.tsx` | Fixed missing `useNavigate()` call (pre-existing bug) | Fix |
| `src\pages\management\Students\EditStudent.tsx` | Fixed `Student` → `StudentInput` mapping (pre-existing bug) | Fix |

### Verification (2026-09-04)

| Check | Command | Result |
|---|---|---|
| JS build (client) | `npm run build` (from `client/`) | PASS |
| JS format (classEase) | `npm run format:check` (from `classEase/`) | PASS |
| JS types (classEase) | `npm run types:check` (from `classEase/`) | PASS |
| PHP lint (Pint) | `vendor\bin\pint --test` | PASS |
| PHPStan / tests | `docker exec phpverif ...` | Docker unavailable |

## Work Completed (2026-09-04, Evening) — Project Journal

- **`ClassEase_Project_Journal.md`** (repo root) — living project journal doc. Contains: project
  overview, problem statement, objectives, tech stack, system architecture, database design
  (ERD us + migration timeline), project structure, user roles/permissions, features implemented,
  all API endpoints, frontend pages, daily progress log, future scope, test accounts, env setup.
- **Diagrams**: 6 professional Mermaid diagrams (architecture, request-flow sequence, Docker,
  ERD, role hierarchy, navigation flow) — embedded as ```` ```mermaid ```` blocks in the journal
  (render in GitHub / VS Code with "Markdown Preview Mermaid Support" extension).
- **Rendered PNGs** (for Google Docs): saved in `docs/diagrams/` — `1-architecture-high-level.png`,
  `2-request-flow-sequence.png`, `3-docker-architecture.png`, `4-erd.png`, `5-role-hierarchy.png`,
  `6-navigation-flow.png`. Rendered via mermaid.ink service.
- **Workflow**: user shares the journal via Google Docs (uploads `.md` → "Open with Google Docs").
  We update this journal daily as new features land; re-render any new/changed diagrams as PNGs.
- **Docs folder**: `docs/diagrams/` is new — keep diagrams in sync when the journal changes.

## Work Completed (2026-09-05)

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `app\Http\Controllers\TeacherController.php` | Added missing `use App\Models\Subject;` — `getTeacherSubjects()` referenced `Subject` without the import (fatal "Class Subject not found") | Fix |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\pages\management\Students\StudentSubjects.tsx` | Created — shows a student's subjects (student info header + subject/class/teacher table) at `/management/students/:id/subjects` | Feature |
| `src\pages\management\Teachers\TeacherSubjects.tsx` | Created — shows a teacher's subjects (teacher info header + subject/class table) at `/management/teachers/:id/subjects` | Feature |
| `src\routes\AppRouter.tsx` | Added `/management/teachers/:id/subjects` and `/management/students/:id/subjects` routes + imports | Feature |
| `src\pages\management\Students\StudentsByClass.tsx` | Added "Subjects" action per student row (navigates to subjects view) | Feature |
| `src\pages\management\Teachers\TeacherList.tsx` | Added "Subjects" action per teacher row (navigates to subjects view) | Feature |

### Verification (2026-09-05)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint (classEase) | `npm run lint:check` | PASS |
| JS format (classEase) | `npm run format:check` | PASS |
| JS types (classEase) | `npm run types:check` | PASS |
| PHP lint (Pint, full) | `vendor\bin\pint --test` | PASS |
| PHPStan / tests | `docker exec phpverif ...` | Docker unavailable (na) |

## What to Do Next (in priority order)

### Blocker (optional)
- **Verify PHP checks via Docker** — Docker Desktop not available in current environment. Run `docker compose up -d` on a machine with Docker Desktop, then `docker exec phpverif php artisan test` and `docker exec phpverif php vendor/bin/phpstan analyse --no-progress`.

### High priority
- **Wayfinder route regeneration** — Run `npm run build` or `wayfinder:generate` after all route changes to regenerate typed route files (gitignored, never commit).
- ~~**Dashboard stats** — Replace `management/Dashboard.tsx` placeholder with real stats cards~~ **DONE (2026-09-04)**
- ~~**Teacher portal** — Replace `teacher/Dashboard.tsx` placeholder with teacher's assigned classes/subjects~~ **DONE (2026-09-04)**
- ~~**Student portal** — Replace `student/Dashboard.tsx` placeholder with student's class/subjects~~ **DONE (2026-09-04)**
- ~~**Attendance** — Mark daily attendance per class~~ **DONE (2026-09-04)**
- ~~**Homework** — Teachers assign homework, students view~~ **DONE (2026-09-04)**

### Medium priority
- ~~**Class edit** — Add Edit button to `ClassList.tsx`.~~ **DONE (before 2026-09-05)** — `ClassForm.tsx`
  handles both create/edit, `AppRouter` has `/management/classes/:id/edit`.
- ~~**Student subjects view** — page showing a student's subjects.~~ **DONE (2026-09-05)**
  — `StudentSubjects.tsx` at `/management/students/:id/subjects`, linked from `StudentsByClass.tsx`.
- ~~**Teacher subjects view** — page showing a teacher's subjects.~~ **DONE (2026-09-05)**
  — `TeacherSubjects.tsx` at `/management/teachers/:id/subjects`, linked from `TeacherList.tsx`.

### Not yet started
- Announcements, Timetable, Scores/Performance, Leaderboard, Concerns

## Build order for remaining features
Scores → Leaderboard → Announcements → Timetable → Concerns