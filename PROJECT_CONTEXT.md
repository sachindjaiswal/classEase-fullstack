# ClassEase — Project Context Checkpoint

> **This file is the persistent checkpoint.** Read this first every session to re-establish
> project state. It records what exists, what has been verified, and how to run everything.
> Keep it in sync with reality after any significant change (new migrations, models, routes,
> Docker changes, or verified baseline updates). Last verified: **2026-09-08**.

## Project at a Glance

Two separate apps in one repo:

- **`classEase/`** — Laravel 13 backend with Inertia.js/React. Primary app. Runs on
  `http://localhost:8000` via `php artisan serve` (local SQLite `.env`).
- **`client/`** — Standalone React SPA (React Router, not Inertia). Runs on
  `http://localhost:5173`. Proxies `/api/*` to the Laravel backend (Vite dev server).
- **`docker/` + `docker-compose.yml`** — Full Dockerized stack (see Docker Setup).

## Core Product Idea (the whole project's basis)

> **IMPLEMENTED 2026-09-07** — the full comparative-performance vision below is now built
> (backend `ComparisonController` + student Performance page with all 3 views; see
> "Work Completed (2026-09-07)").

The entire project is built around a **comparative performance** idea for students:

1. **Compare with classmates** — each and every student gets to compare themselves against the
   other students of their own class (who scored more, in which subject, by how much).
2. **Learn how to outscore others** — a student should be able to see what the higher-performing
   students did (which subjects they outperform in, etc.) so they know what to do to get more
   marks than them.
3. **Beat your past self** — compare against the student's **own previous marks**, e.g. the
   previous semester, to track progress over time.

### Comparative Performance — Design Plan (2026-09-07) ✅ ALL DONE

**Problem today:** Leaderboard ranks students overall but has no per-subject drill-down and no
"vs past self" view. Scores has no `semester` column, so time-based comparison is impossible.

#### Step 1: Add `semester` to scores (migration) ✅ DONE

- Migration `2026_09_07_000001_add_semester_to_scores_table`: adds `string('semester')` default
  `'current'`, unique constraint is now `(student_id, subject_id, exam_type, semester)`.
- Idempotent (`hasColumn`/`hasIndex` guards) and re-orders operations (adds new unique **before**
  dropping the old one) because MySQL won't drop an index that still backs a FK — verified against
  error 1553 on the docker MySQL instance.
- `Score` model `$fillable` + `@property` docblock; `ScoreController` add/update validation accepts
  `semester`, duplicate (409) check includes it. Frontend `AddScore`/`EditScore` have a freeform
  semester input (default `'current'`); `ScoresByClass` has a semester dropdown + Semester column.

#### Step 2: Backend — `ComparisonController` (3 endpoints) ✅ DONE

All endpoints under `role:admin,teacher,student` (students see their own; admin/teacher any student).

| Endpoint | Returns |
|---|---|
| `GET /comparison/subject/{classId}/{subjectId}?exam=&semester=` | per-student marks + %, `is_you` flag, class avg/min/max |
| `GET /comparison/gaps/{studentId}?semester=` | per-subject: my %, top-3 avg, class avg, gap_to_top3, gap_to_class � sorted gap desc |
| `GET /comparison/progress/{studentId}` | per-subject: current vs previous semester %, delta, trend (up/down/same) + summary (improved/declined counts, overall delta) |
| `GET /comparison/headtohead/{studentA}/{studentB}?semester=` | **Head-to-head (added later, same day):** per-subject A% vs B%, delta, leader (A/B/tie/n-a) + summary (subjects compared, A wins, B wins, ties). Sorted by |delta| desc |

Head-to-head access (decided same day): students compare **themselves vs any classmate** (requester must be A or B ? else 403, and **same-class required for students** ? else 403); admin/teacher pick any two students from a class roster. UI = a 4th "Head-to-Head" tab (student) and the same page for staff at `/management/performance` + `/teacher/performance` (staff mode shows only the Head-to-Head tab, with class + student A + student B pickers).

- `gaps`/`progress` guard student access via `isStudentForbidden` (like `ConcernController`) so a
  student can only ever read their own. `bySubject` also adds `is_you` per entry.
- `progress`: "current" = semester `'current'`; "previous" = most recent *other* semester by score
  `created_at` (freeform naming can't be ordered lexicographically).

#### Step 3: Frontend — Student "Performance" page (`/student/performance`) ✅ DONE

Three tab views inside one page (sidebar link **"Performance"**):

1. **"vs Classmates"** — subject dropdown (own class subjects), exam filter, semester dropdown →
   classmates' marks/% table with your row highlighted green ("You" badge), class average/min/max.
2. **"Where to Focus"** — per-subject cards sorted by gap to top 3 (biggest first)
   "Mathematics: 11.5% behind the top — biggest opportunity."
3. **"My Progress"** — per-subject previous vs current semester % with trend arrows + overall
   summary cards (overall change, improved/declined counts).

#### Step 4: Wire existing features to semester ✅ DONE

- `ScoresByClass.tsx` — semester dropdown filter (client-side) + Semester column.
- `LeaderboardByClass.tsx` — semester dropdown (options from `GET /scores/class/{id}`); backend
  `LeaderboardController` now accepts `?semester=` (default `'current'`).
- `AddScore.tsx` / `EditScore.tsx` — freeform semester input (default `"current"`).

#### Open questions — RESOLVED (2026-09-07)

1. Semester naming: **freeform text** (e.g. `Fall 2025`).
2. Admin/teacher comparisons for any student: **yes** (endpoint RBAC = `role:admin,teacher,student`).
3. Sidebar link name: **"Performance"**.

#### Bonus fix (same user↔student mapping)

User ids ≠ Student ids in this seed (e.g. `student1@classease.com` is user 6 → student 1). All
`/student/{id}*` routes take the **student** id, not the user id. Added `GET /student/me`
(`StudentController::getMyStudent`) resolving the auth user's own Student row, and switched the
student **Dashboard + Performance** pages to use it (Dashboard previously called `getStudent(user.id)`
and displayed another student's data — pre-existing bug, now fixed).

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
- As of 2026-09-06: RBAC API hardening + Timetable module also not yet committed (same
  un-committed work stream). No git changes made today; working tree uncommitted.

## Verified Green Baseline (2026-08-19, updated 2026-09-07)

All of the following pass. **Run in this order.**

| Check | Command (from `classEase/`) | Status |
|---|---|---|
| JS lint | `npm run lint:check` | PASS |
| JS format | `npm run format:check` | PASS |
| JS types | `npm run types:check` | PASS |
| PHP lint | `& "C:\xampp\php\php.exe" vendor\bin\pint --test` | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | PASS (0 errors, was 20) |
| Tests | see "Running Tests" below | 20 passed (81 assertions) |
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
- **Vite dev (client 5174) can serve STALE source**: the Windows bind mount + chokidar missed file
  changes, so the running server kept serving pre-edit modules (e.g. Add Teacher page without the
  password field → submit silently failed: `password` undefined → backend 422 with no field to show
  it). Fixed 2026-09-07: `client/vite.config.ts` sets `server.watch.usePolling = true`. If the client
  ever looks stale again: `docker compose restart client` then hard-refresh the browser (Ctrl+F5).
- **New client npm deps need installing inside the container**: the client's `client-node-modules`
  volume is separate from the Windows host `node_modules`. Installing a new package on the host (e.g.
  `recharts`, 2026-09-08) does NOT reach the container → run `docker exec classease-client npm install`
  (reads the updated `package-lock.json`) then `docker compose restart client` (re-optimizes + picks up
  the new source).

## Backend (Laravel 13, classEase/)

### Models — naming inconsistency is intentional, do not "fix"

- `User` — `app/Models/User.php`. fillable: name, email, password, **role**. Uses PHP attributes
  `#[Fillable]`/`#[Hidden]` (Laravel 12+ feature) + `$fillable`/`$hidden` arrays. `hasOne` Student, Teacher.
  **`SoftDeletes`** (added 2026-09-07 — deleting a student/teacher revokes their login; since
  2026-09-07#2 the linked User is **force-deleted** so the email is reusable, while the
  student/teacher row stays soft-deleted for the record).
- `teacher.php` — **file is lowercase `teacher.php`**, class `Teacher`. `SoftDeletes`.
  snake_case columns: `first_name`, `middle_name`, `surname`, `contact`, `designation`,
  `monthly_salary` (int). `belongsTo` User; `hasMany` classes (via `class_teacher`), subjects (via `teacherId`).
- `classes.php` — **file lowercase `classes.php`**, class **`classes`** (lowercase). snake_case:
  `class_teacher` (nullable FK → teachers, nullOnDelete), `class_name`, `section`, `room_no`.
  `belongsTo` Teacher (via `class_teacher`); `hasMany` Subject (via `classId`).
- `Student` — `SoftDeletes`. **camelCase** columns: `classId` (FK → classes), `firstName`,
  `middleName`, `surname`, `contact`, `parentContact`, `address`. `user_id` unique FK → users.
  `belongsTo` User, classes. `hasMany` Attendance (via `student_id`) — added 2026-09-08 to resolve
  a PHPStan relation-existence error (AttendanceController already eagerly-loaded it).
- `Subject` — **camelCase**: `classId` (FK → classes), `subjectName`, `teacherId` (FK → teachers).
  `belongsTo` classes, Teacher. (Model `$hidden` lists `user_id` which doesn't exist on this table — known quirk, harmless.)
- `Attendance` — `student_id` (FK → students), `class_id` (FK → classes), `date` (date), `status` (enum: present/absent/late), `marked_by` (nullable FK → teachers), `remarks` (nullable). Unique constraint on (`student_id`, `date`). `belongsTo` Student, classes, marker (Teacher).
- `Homework` — `class_id` (FK → classes), `subject_id` (FK → subjects), `assigned_by` (FK → teachers, NOT NULL — teacher who assigned), `title`, `description` (nullable), `assigned_date` (date), `due_date` (date). `belongsTo` classes, Subject, Teacher. **Explicit `$table = 'homeworks'`** — Eloquent's pluralizer treats "homework" as uncountable → default table is `homework` which doesn't exist (latent bug found 2026-09-07; the migration/DB use `homeworks`).
- `Score` — `student_id` (FK → students), `subject_id` (FK → subjects), `class_id` (FK → classes), `exam_type` (string: Unit Test/Midterm Exam/Final Exam), `semester` (string, default `current`), `marks_obtained`, `total_marks` (unsigned ints). Composite unique constraint on (`student_id`, `subject_id`, `exam_type`, `semester`). `belongsTo` Student, Subject, classes.
- `Announcement` — `class_id` (nullable FK → classes, null = general/all classes), `title`, `description` (nullable), `posted_by` (nullable FK → users). `belongsTo` classes, User (poster).
- `Timetable` — `class_id` (FK → classes), `day` (string: Monday–Friday), `period` (string, e.g. `1st`), `subject_id` (nullable FK → subjects), `teacher_id` (nullable FK → teachers), `start_time`/`end_time` (nullable times). Unique constraint on (`class_id`, `day`, `period`). `belongsTo` classes, Subject, Teacher.
- `Concern` — `student_id` (FK → students), `subject` (string), `description` (nullable text), `status` (enum: open/in_progress/resolved, default open), `admin_reply` (nullable text), `resolved_by` (nullable FK → users). `belongsTo` Student, User (resolver).

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
  `getMyStudent` (auth user's own Student row → `GET /student/me`), `updateStudent`, `deleteStudent`.
  `getStudent` returns `{message, student}`. `addStudent` returns `{message, student}` with 201 status.
  `getAllStudentFromClass` is in the all-roles group but guards **students to their own class** (403 otherwise).
  **Login accounts (2026-09-07)**: `addStudent` now also creates a `User` (role `student`, email = the student email,
  password = the entered password, linked via `user_id`, in a transaction). Email is unique across both `students` and `users`.
  `updateStudent` syncs the linked User's name/email and password (blank keeps current); creates the login when none exists
  yet (legacy students) if a password is supplied. `deleteStudent` soft-deletes the linked User, revoking the login.
- `TeacherController` — `getAllTeachers`, `getTeacher`, `getTeacherMe` (authenticated user's own teacher profile via `user->teacher` — needed because teacher id ≠ user id), `createTeacher`, `updateTeacher`, `deleteTeacher`.
  `getTeacherSubjects` ($id) — subject list for a teacher. **Login accounts (2026-09-07)**: `createTeacher` now requires a
  `password` (min 6) and creates a `User` (role `teacher`, same email, linked `user_id`, in a transaction). Email unique across
  `teachers` and `users`. `updateTeacher` syncs the linked User's name/email and password (blank keeps current); `deleteTeacher`
  soft-deletes the linked User.
- `SubjectController` — `getAllSubjects`, `getSubject`, `getSubjectsByClass` (GET /subjects/class/{id} — all subjects of a class with class+teacher, used by the teacher timetable editor), `createSubject`, `updateSubject`, `deleteSubject`.
- `DashboardController` — `getStats` (returns teacher/student/class/subject counts), `getFeed` (`GET /dashboard/feed` — role-scoped notices + tasks: admin = all announcements + all homework; teacher = announcements with `class_id` null or in the teacher's classIds (union of `teacher->classes()` ids and `teacher->subjects()` classIds, unique) + homework where `class_id` in classIds OR `assigned_by == teacher`; student = announcements null or own classId + homework of own classId. Announcements `created_at desc`, homeworks `due_date asc`, eager-loads class + poster + subject + teacher).
- `AttendanceController` — `markAttendance` (bulk), `getAttendanceByClass`, `getStudentAttendance`, `updateAttendance`.
- `HomeworkController` — `createHomework`, `getHomework`, `updateHomework`, `deleteHomework`, `getHomeworkByClass`, `getHomeworkByStudent`.
- `ScoreController` — `addScore`, `getScore`, `getScoresByClass`, `getStudentScores`, `updateScore`, `deleteScore`. Eager-loads only safe columns (student password/user_id never exposed). Accepts `semester` (default field); duplicate (student_id, subject_id, exam_type, semester) → 409.
- `LeaderboardController` — `getLeaderboardByClass` — ranks students in a class by overall average percentage (sum marks_obtained / sum total_marks), optional `?exam=` **and `?semester=`** (default `'current'`) filters, computed on the fly from scores (no new table). Returns `semester`. Class case fixed (`use App\Models\classes;`).
- `AnnouncementController` — `createAnnouncement`, `getAnnouncements`, `getAnnouncementsByClass` (class + general), `getAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `getAnnouncementsByStudent`. Routes ordered so `/announcements/class|student/{...}` precede `/announcements/{id}`. Eager-loads `class` + `poster` (user: id, name only).
- `TimetableController` — `saveTimetable` (bulk upsert a class's full grid: deletes removed (day, period) slots then updateOrCreate each submitted slot; teacher_id auto-fills from the subject if omitted), `getTimetableByClass`, `getTimetableByTeacher` (entries where teacher_id matches), `updateTimetable`, `deleteTimetable`. `DAYS` const = Monday–Friday.
- `ConcernController` — `createConcern` (student raises; student_id resolved from the authenticated user's `user_id`, status forced `open`), `getConcerns` (all, newest first), `getConcernsByStudent`, `getConcern`, `updateConcern` (status + admin_reply; auto-sets `resolved_by` when resolving, clears it otherwise), `deleteConcern`. Students are scoped to their own concerns via `isStudentForbidden` (403 otherwise).
- `ComparisonController` — `bySubject` (`GET /comparison/subject/{classId}/{subjectId}`, optional `?exam=&semester=`), `gaps` (per-subject gap to top-3 avg & class avg, sorted desc), `progress` (current vs latest other semester per subject + summary), `headToHead` (`GET /comparison/headtohead/{studentA}/{studentB}` — per-subject A% vs B%, delta, leader, wins summary; students must be one of the pair **and same class**, admin/teacher any two). Students can only access their own `gaps`/`progress` via `isStudentForbidden`; admin/teacher any student. Uses flat Eloquent `Collection<int, Score>` + `@param` docblocks for PHPStan.
- `Resources/ClassesResource.php` — has `@property-read` docblock.

### Routes

- `routes/api.php` — public: `POST /api/login`, `POST /api/register` (register now **always**
  creates a `student` account — role is forced server-side, never trusted from the client).
- Rest under `auth:sanctum` with **role-based access control** via the `role` middleware alias
  (`App\Http\Middleware\RoleMiddleware`, registered in `bootstrap/app.php`). Three groups:
  - **`role:admin`** (management): `/dashboard/stats`, `/classes` (all CRUD), `/students` (POST),
    `/student/{id}` (PUT/DELETE), `/teachers` (POST/GET/PUT/DELETE), `/subjects` (POST/GET/PUT/DELETE).
  - **`role:admin,teacher`** (academic manage): `/teachers/{id}` (GET),
    `/teacher/me` (GET — own profile), `/teacher/{id}/subjects` (GET), `/subjects/{id}` (GET),
    `/subjects/class/{classId}` (GET), `/attendance` (POST), `/attendance/class` (GET),
    `/attendance/{id}` (PUT), `/homework` (POST), `/homework/{id}` (PUT/DELETE), `/scores` (POST),
    `/scores/{id}` (PUT/DELETE), `/announcements` (POST), `/announcements/{id}` (PUT/DELETE),
    `/timetable` (POST), `/timetable/{id}` (PUT/DELETE), `/concerns` (GET), `/concerns/{id}` (PUT/DELETE).
  - **`role:student`**: `/concerns` (POST) — students raise concerns.
  - **`role:admin,teacher,student`** (read-only): `/student/me` (GET), `/student/class/{id}` (GET — students own class only),
    `/student/{id}` (GET),
    `/student/{id}/subjects` (GET), `/attendance/student/{id}` (GET), `/homework/{id}` (GET),
    `/homework/class/{classId}` (GET), `/homework/student/{studentId}` (GET), `/scores/{id}` (GET),
    `/scores/class/{classId}` (GET), `/scores/student/{studentId}` (GET),
    `/leaderboard/class/{classId}` (GET), `/announcements` (GET),
    `/announcements/class/{classId}` (GET), `/announcements/student/{studentId}` (GET), `/announcements/{id}` (GET),
    `/timetable/class/{classId}` (GET), `/timetable/teacher/{teacherId}` (GET),
    `/concerns/student/{studentId}` (GET), `/concerns/{id}` (GET),
    `/comparison/subject/{classId}/{subjectId}` (GET), `/comparison/gaps/{studentId}` (GET),
    `/comparison/progress/{studentId}` (GET), `/comparison/headtohead/{studentA}/{studentB}` (GET),
    `/dashboard/feed` (GET).
  - Route order note: `/student/me` must be declared **before** `/student/{id}` (Laravel matches in
    declaration order | would swallow "me" otherwise). Same for `/concerns/student|class|{id}`.
  - Plus `/me` and `/logout` available to all authenticated roles (defined inside `auth:sanctum`
    but outside the role groups).
- **Singular/plural inconsistency (do NOT "fix" without fixing the client too):**
  `POST /students` (plural) but `GET /student/{id}` and `GET /student/class/{id}` (singular).
- `routes/web.php` — only `/student-form` view (plus removed unused AuthController import).
- `bootstrap/app.php` — health check at `/up`; registers `role` middleware alias.

### Migrations (18)

`users` (incl. `deleted_at` from `2026_09_07_000002_add_soft_deletes_to_users_table`), `cache`, `jobs`, `teachers`, `classes`, `students`, `personal_access_tokens`,
`subjects`, `add_email_to_teachers`, `add_email_password_to_students`
(both untracked), `attendances`, `homeworks`, `scores`,
`add_semester_to_scores_table` (untracked, 2026-09-07), `announcements`, `timetables`, `concerns`. Columns per model above; teachers/students/users use `softDeletes`.
`add_semester_to_scores_table` adds `semester` (default `current`) to `scores` and swaps the unique
constraint to `(student_id, subject_id, exam_type, semester)` — idempotent (`hasColumn`/`hasIndex`),
adds the new unique before dropping the old (MySQL Error 1553 fix).

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
  (management/teacher/student), `AuthContext`. **Recharts** (^3.10.1) added 2026-09-08 for the
  dashboards. **No lint/format/typecheck scripts** — only `dev`, `build`, `preview`.

### Client page structure (as of 2026-09-08)

- **Auth**: `Login.tsx`, `Register.tsx` — `AuthContext` (login, register, logout, me).
- **Management** (role: management):
  - `Dashboard.tsx` — stats cards (Teachers, Students, Classes, Subjects counts with icons) **+ Notices & Tasks feed (NoticesTasks component)**; **redesigned 2026-09-08** with Recharts: Students-per-Class + Class Performance + Scores-by-Subject charts
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
  - `Scores/ScoresByClass.tsx` — scores by class with exam **+ semester** filters + Semester column + Edit/Delete
  - `Scores/AddScore.tsx` — create score (class → subject → student cascade filters) **+ freeform semester input (default "current")**
  - `Scores/EditScore.tsx` — edit score (incl. semester)
  - `Scores/exams.ts` — shared exam type constants
  - `Leaderboard/LeaderboardByClass.tsx` — ranked table (avg % per class, exam **+ semester** filter, top-3 medals)
  - `Announcements/AnnouncementList.tsx` — audience filter, title/audience/poster/date table
  - `Announcements/AddAnnouncement.tsx` — post (general or per class)
  - `Announcements/EditAnnouncement.tsx` — edit announcement
  - `Timetable/TimetableGrid.tsx` — per-class grid editor: rows = periods, cols = Mon–Fri, subject per cell,
    add/remove period rows, bulk save
  - `Concerns/ConcernList.tsx` — status filter + table (student, subject, status, date), inline respond
    (status select + reply), delete (hidden for teacher via `canDelete` prop)
- **Teacher** (role: teacher): `Dashboard.tsx` — **redesigned 2026-09-08** (Recharts: today's attendance pie, class performance by subject bar, per-student performance bar w/ subject selector, subjects cards with avg% bars) **+ Notices & Tasks feed (own classes + general + own homework)**; `Marks.tsx` — enter/edit/delete scores scoped to the teacher's classes + subjects (roster via `/student/class/{id}`, list via `/scores/class/{id}`); `Timetable.tsx` — class timetable **editor** (classes = teacher's, subject options = all subjects of the selected class via `getSubjectsByClass`) + "Your periods this week" read-only view below; `Announcements.tsx` — post/edit/delete notices (audience = general or teacher's classes); `Concerns.tsx` — all-student concerns (no delete)
- **Teacher id resolution (pre-existing bug fixed)**: teacher id ≠ user id (user `teacher1@…` maps to teacher row with a different numeric id). Teacher pages previously passed `user.id` to `getTeacher`/`getTeacherSubjects`/`getTimetableByTeacher` — wrong teacher/data on seeded accounts. Now all teacher pages call **`getTeacherMe()`** (`/teacher/me`) first and use `teacher.id` for subject/timetable reads.
- **Student** (role: student): `Dashboard.tsx` — **redesigned 2026-09-08** (Recharts: class-rank donut gauge, attendance pie, subject % bar, you-vs-class-average grouped bar, progress-over-time grouped bar, homework overview) **+ Notices & Tasks feed**; `Performance.tsx` — **comparative performance (5 tabs: vs Classmates / Class Rank / Where to Focus / My Progress / Head-to-Head)**, also reused for staff (role-aware): at `/teacher/performance` and `/management/performance` it shows only the Head-to-Head tab with class + student A + student B pickers; `Timetable.tsx` — own class schedule; `Concerns.tsx` — raise concern form + track own (status badge + admin reply)
- **Shared**: `Sidebar.tsx` (role-based nav links — student gets **Performance**; management + teacher also get **Performance**), `DashboardLayout.tsx`, `Button.tsx`, **`PasswordInput.tsx`** (Show/Hide toggle, used by Add/Edit Teacher + Add/Edit Student), `StatusBadge.tsx`, `PlaceholderPage.tsx`, `TimetableView.tsx` (read-only period×day grid)
- **API layer**: `api/axios.ts`, `api/classes.ts`, `api/students.ts` (**incl. `getMyStudent`**), `api/teachers.ts` (**incl. `getTeacherMe`**), `api/subjects.ts` (**incl. `getSubjectsByClass`**), `api/dashboard.ts` (**`getDashboardStats` + `getDashboardFeed` — both typed**), `api/attendance.ts`, `api/homework.ts`, `api/scores.ts` (incl. `getScoresByClass`), `api/leaderboard.ts` (semester param), `api/comparison.ts` (**bySubject/gaps/progress/headToHead**), `api/announcements.ts`, `api/timetable.ts`, `api/concerns.ts`
- **Types**: `types/index.ts` (… + Score `semester`, LeaderboardResponse `semester`, ScoreWithMeta, SubjectComparisonEntry, SubjectComparisonResponse, StudentGap, GapsResponse/ProgressEntry, ProgressResponse, HeadToHeadResult, HeadToHeadResponse, **DashboardFeed `{ announcements, homeworks }`**) — **mapping gotcha**: student pages must resolve their own Student row via `getMyStudent()` (user id ≠ student id in seed), never `getStudent(user.id)`

### Sidebar nav links (management)

Dashboard, Students, Teachers, Classes, Subjects, **Timetable**, Attendance, Homework, Scores, Leaderboard, **Announcements**, **Concerns**, **Performance** (Subjects added 2026-09-03, Attendance 2026-09-04, Homework 2026-09-04, Scores 2026-09-05, Leaderboard 2026-09-05, Announcements 2026-09-05, Timetable 2026-09-06, Concerns 2026-09-06, Performance (staff) 2026-09-07).

### Sidebar nav links (student)

Dashboard, **Performance** (added 2026-09-07), Timetable, Concerns.

### Sidebar nav links (teacher)

Dashboard, **Marks** (added 2026-09-07), Timetable, **Announcements** (added 2026-09-07), Concerns, **Performance** (added 2026-09-07).

### Sidebar nav links (management)

See management list above (includes **Performance**).

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

## Work Completed (2026-09-05, Afternoon) — Scores Module

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `database\migrations\2026_09_05_000001_create_scores_table.php` | Created — scores table (student_id, subject_id, class_id, exam_type, marks_obtained, total_marks, unique [student_id, subject_id, exam_type]) | Feature |
| `app\Models\Score.php` | Created — model with student/subject/class belongsTo relations | Feature |
| `app\Http\Controllers\ScoreController.php` | Created — addScore, getScore, getScoresByClass, getStudentScores, updateScore, deleteScore. 409 on composite duplicate. Eager-loads safe columns only (no password/user_id) | Feature |
| `routes\api.php` | Added 6 scores routes under auth:sanctum | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\scores.ts` | Created — createScore, getScore, updateScore, deleteScore, getScoresByClass, getStudentScores | Feature |
| `src\types\index.ts` | Added Score, ScoreInput, StudentSummary, ScoreFull types | Feature |
| `src\pages\management\Scores\ScoresByClass.tsx` | Created — scores by class with exam filter, marks + % table, Edit/Delete | Feature |
| `src\pages\management\Scores\AddScore.tsx` | Created — record score (class → subject → student cascade filters, exam select) | Feature |
| `src\pages\management\Scores\EditScore.tsx` | Created — edit score (state prefill or fetch by id) | Feature |
| `src\pages\management\Scores\exams.ts` | Created — shared EXAM_TYPES constant (Unit Test / Midterm Exam / Final Exam) | Feature |
| `src\routes\AppRouter.tsx` | Added `/management/scores`, `/management/scores/new`, `/management/scores/:id/edit` routes + imports | Feature |
| `src\components\Sidebar.tsx` | Added Scores link under management | Feature |
| `src\pages\student\Dashboard.tsx` | Added "Your Scores" card (subject, exam, marks, %) | Feature |

### Docs

| File | Change | Type |
|---|---|---|
| `ClassEase_Project_Journal.md` | Added Module 9 (Scores), Scores API table, page structure, Day 7 progress, navigation flow updated, Phase 2 scores marked done | Docs |
| `docs\diagrams\6-navigation-flow.png` | Re-rendered via mermaid.ink after nav flow added Scores/Subjects nodes | Docs |

### Verification (2026-09-05, Afternoon)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint (classEase) | `npm run lint:check` | PASS |
| JS format (classEase) | `npm run format:check` | PASS |
| JS types (classEase) | `npm run types:check` | PASS |
| PHP lint (Pint, full) | `vendor\bin\pint --test` | PASS |
| PHPStan / tests | `docker exec phpverif ...` | Docker unavailable (na) |

## Work Completed (2026-09-05, Afternoon Part 2) — Leaderboard Module

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `app\Http\Controllers\LeaderboardController.php` | Created — ranks students per class by overall average %, optional `?exam=` filter, no new table | Feature |
| `routes\api.php` | Added 1 leaderboard route under auth:sanctum | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\leaderboard.ts` | Created — getLeaderboardByClass | Feature |
| `src\types\index.ts` | Added LeaderboardEntry, LeaderboardResponse | Feature |
| `src\pages\management\Leaderboard\LeaderboardByClass.tsx` | Created — class/exam selectors, ranked table, top-3 medal badges | Feature |
| `src\routes\AppRouter.tsx` | Added `/management/leaderboard` route + import | Feature |
| `src\components\Sidebar.tsx` | Added Leaderboard link | Feature |

### Docs

| File | Change | Type |
|---|---|---|
| `ClassEase_Project_Journal.md` | Added Module 10 (Leaderboard), Leaderboard API table, page tree + nav flow nodes, Day 7 leaderboard progress, Phase 2 leaderboard marked done | Docs |
| `docs\diagrams\6-navigation-flow.png` | Re-rendered via mermaid.ink after nav flow added Leaderboard node | Docs |

### Verification (2026-09-05, Afternoon Part 2)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint (classEase) | `npm run lint:check` | PASS |
| JS format (classEase) | `npm run format:check` | PASS |
| JS types (classEase) | `npm run types:check` | PASS |
| PHP lint (Pint, full) | `vendor\bin\pint --test` | PASS |
| PHPStan / tests | `docker exec phpverif ...` | Docker unavailable (na) |

## Work Completed (2026-09-05, Afternoon Part 3) — Announcements Module

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `database\migrations\2026_09_05_000002_create_announcements_table.php` | Created — announcements (nullable class_id = general, posted_by → users nullOnDelete) | Feature |
| `app\Models\Announcement.php` | Created — class + poster belongsTo relations | Feature |
| `app\Http\Controllers\AnnouncementController.php` | Created — create/list/all/by-class/by-student/get/update/delete | Feature |
| `routes\api.php` | Added 7 announcement routes (specific routes before `/{id}`), import order fixed | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\announcements.ts` | Created — all announcement API functions | Feature |
| `src\types\index.ts` | Added Announcement, AnnouncementInput, AnnouncementPoster | Feature |
| `src\pages\management\Announcements\AnnouncementList.tsx` | Created — audience filter (all / class), title/audience/poster/date table, Edit/Delete | Feature |
| `src\pages\management\Announcements\AddAnnouncement.tsx` | Created — post announcement (general or per class) | Feature |
| `src\pages\management\Announcements\EditAnnouncement.tsx` | Created — edit announcement (state prefill or fetch) | Feature |
| `src\routes\AppRouter.tsx` | Added `/management/announcements`, `/new`, `/:id/edit` routes | Feature |
| `src\components\Sidebar.tsx` | Added Announcements link | Feature |
| `src\pages\student\Dashboard.tsx` | Added Announcements card (own class + general) | Feature |

### Docs

| File | Change | Type |
|---|---|---|
| `ClassEase_Project_Journal.md` | Added Module 11, Announcements API table, page tree + nav nodes, Day 7 progress, Phase 2 announcements marked done | Docs |
| `docs\diagrams\6-navigation-flow.png` | Re-rendered via mermaid.ink after nav flow added Announcements node | Docs |

### Verification (2026-09-05, Afternoon Part 3)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint (classEase) | `npm run lint:check` | PASS |
| JS format (classEase) | `npm run format:check` | PASS |
| JS types (classEase) | `npm run types:check` | PASS |
| PHP lint (Pint, full) | `vendor\bin\pint --test` | PASS |
| PHPStan / tests | `docker exec phpverif ...` | Docker unavailable (na) |

## Work Completed (2026-09-06) — Role-Based Access Control (Auth Hardening)

Backend now enforces role-based access on **every** protected API route via the existing
`RoleMiddleware` (`role` alias), which was previously registered but **never applied**. Three
scope groups on `routes/api.php`: `role:admin` (management CRUD + dashboard stats),
`role:admin,teacher` (academic write/manage + shared reads), `role:admin,teacher,student`
(read-only). `/me` + `/logout` stay available to all roles.

| File | Change | Type |
|---|---|---|
| `routes\api.php` | Split auth:sanctum group into 3 role-scoped middleware groups; removed duplicate `/student/{id}` + `/student/{id}/subjects` GETs from admin group (they live in the all-roles group) | Feature |
| `app\Http\Controllers\AuthController.php` | `register()` always creates a `student` account; removed acceptance/validation of a client-supplied `role` | Security |
| `client\src\pages\auth\Register.tsx` | Removed role selector + role validation; subtitle now says "student account" | Feature |
| `client\src\context\AuthContext.tsx` | `register()` signature dropped the `role` param | Feature |

Permission matrix (route-level):

| Area | admin | teacher | student |
|---|---|---|---|
| Dashboard stats | ✅ | ❌ | ❌ |
| Classes / Teachers / Students / Subjects CRUD | ✅ | ❌ | ❌ |
| Class roster, teacher/subject reads | ✅ | ✅ | ❌ |
| Attendance / Homework / Scores / Announcements (write) | ✅ | ✅ | ❌ |
| All read/view endpoints (own data, lists, leaderboard) | ✅ | ✅ | ✅ |
| `/me`, `/logout` | ✅ | ✅ | ✅ |

### Verification (2026-09-06)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| PHP syntax + Pint | `php -l` + `pint --test` on changed files | PASS |
| Tests | `docker exec phpverif ... php artisan test` | PASS (3 passed, 6 assertions) |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | **20 errors (pre-existing)** — see below |

`RoleMiddleware` missing-type error introduced by enabling RBAC was fixed (typed `string ...$roles`).
The remaining 20 PHPStan errors are all **pre-existing** in controllers from the unverified
2026-09-04/09-05 work (Attendance, Leaderboard, Student, Subject, Teacher) — none are in files
touched by the RBAC/comparison tasks (the 2 `LeaderboardController` `classes`-case errors fixed on
2026-09-07 brought the count from 22 → 20). See "Blocker → PHPStan" under What to Do Next.

## What to Do Next (in priority order)

### Blocker (resolved 2026-09-08)
- ~~**PHPStan: 20 pre-existing errors** (from unverified 2026-09-04/09-05 work)~~ **RESOLVED (2026-09-08)**.
  Added missing `Student::attendance()` HasMany relation; typed the `$id` params (`int`) + return types
  (`JsonResponse`) on StudentController::getStudentSubjects, TeacherController::getTeacherSubjects, and
  all 5 SubjectController methods (getAllSubjects/getSubject/createSubject/updateSubject/deleteSubject);
  the nullsafe `?->` on `attendance->first()` resolved once the relation existed. `phpstan analyse` now
  reports **`[OK] No errors`** (was 20).

### High priority
- ~~**Wayfinder route regeneration**~~ **DONE (2026-09-08)** — `docker exec phpverif php artisan wayfinder:generate --with-form` regenerated `resources/js/actions/` + `resources/js/routes/` inside the container (gitignored). Note: the classEase Inertia app pages don't import wayfinder-generated routes (grep found none), so these are routine artifacts only.
- ~~**Dashboard stats** — Replace `management/Dashboard.tsx` placeholder with real stats cards~~ **DONE (2026-09-04)**
- ~~**Teacher portal** — Replace `teacher/Dashboard.tsx` placeholder with teacher's assigned classes/subjects~~ **DONE (2026-09-04)**
- ~~**Student portal** — Replace `student/Dashboard.tsx` placeholder with student's class/subjects~~ **DONE (2026-09-04)**
- ~~**Attendance** — Mark daily attendance per class~~ **DONE (2026-09-04)**
- ~~**Homework** — Teachers assign homework, students view~~ **DONE (2026-09-04)**
- ~~**Scores** — Track student marks per subject per exam~~ **DONE (2026-09-05)**
- ~~**Leaderboard** — Rank students by performance in a class~~ **DONE (2026-09-05)**
- ~~**Announcements** — Post announcements to a class or everyone~~ **DONE (2026-09-05)**
- ~~**Timetable** — Set and view weekly class schedules~~ **DONE (2026-09-06)**

### Medium priority
- ~~**Class edit** — Add Edit button to `ClassList.tsx`.~~ **DONE (before 2026-09-05)** — `ClassForm.tsx`
  handles both create/edit, `AppRouter` has `/management/classes/:id/edit`.
- ~~**Student subjects view** — page showing a student's subjects.~~ **DONE (2026-09-05)**
  — `StudentSubjects.tsx` at `/management/students/:id/subjects`, linked from `StudentsByClass.tsx`.
- ~~**Teacher subjects view** — page showing a teacher's subjects.~~ **DONE (2026-09-05)**
  — `TeacherSubjects.tsx` at `/management/teachers/:id/subjects`, linked from `TeacherList.tsx`.

### All planned modules complete (2026-09-06)

Every planned Phase 1/2 module (Auth/RBAC, Classes, Teachers, Students, Subjects, Attendance,
Homework, Scores, Leaderboard, Announcements, Timetable, Concerns) is implemented & verified.
Still open (quality, non-module):
- ~~20 pre-existing PHPStan errors (lvl 7) in Attendance/Student/Subject/Teacher controllers~~ **RESOLVED (2026-09-08)** — see Blocker above.
- ~~**Admin-created teachers/students don't create matching `User` login accounts** — now DONE (2026-09-07): addStudent/createTeacher create the login (email+password), update syncs it, delete revokes it. Admin is the single permanent account (seeded, role forced over API). See Work Completed (2026-09-07, later).~~
- ~~**The core comparative-performance idea** — now IMPLEMENTED (2026-09-07) — see "Core Product Idea" at top; also see Work Completed (2026-09-07).~~

## Work Completed (2026-09-06, Session 3) — Concerns Module

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `database\migrations\2026_09_06_000002_create_concerns_table.php` | Created — concerns (student_id, subject, description, status enum open/in_progress/resolved, admin_reply, resolved_by) | Feature |
| `app\Models\Concern.php` | Created — belongsTo Student, User (resolver) | Feature |
| `app\Http\Controllers\ConcernController.php` | Created — createConcern (student_id from auth user), getConcerns, getConcernsByStudent, getConcern, updateConcern (auto-resolved_by), deleteConcern; students scoped to own concerns via isStudentForbidden (403) | Feature |
| `routes\api.php` | Added 6 concern routes: GET/PUT/DELETE `/concerns` (admin,teacher), POST `/concerns` (student), GET `/concerns/student/{id}` + `/concerns/{id}` (admin,teacher,student) | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\concerns.ts` | Created — createConcern, getConcerns, getConcern, getConcernsByStudent, updateConcern, deleteConcern | Feature |
| `src\types\index.ts` | Added ConcernStatus, Concern, ConcernStudent, ConcernResolver, ConcernInput, ConcernUpdateInput | Feature |
| `src\pages\management\Concerns\ConcernList.tsx` | Created — status filter + table, inline respond (status select + reply), delete; `canDelete` prop (false for teacher) | Feature |
| `src\pages\student\Concerns.tsx` | Created — raise concern form + track own (status badge + admin reply) | Feature |
| `src\pages\teacher\Concerns.tsx` | Created — reuses ConcernList with canDelete=false | Feature |
| `src\routes\AppRouter.tsx` | Added `/management/concerns`, `/teacher/concerns`, `/student/concerns` | Feature |
| `src\components\Sidebar.tsx` | Added Concerns links for management/teacher/student | Feature |

### Verification (2026-09-06, Session 3)

| Check | Command | Result |
|---|---|---|
| Migration | `docker exec phpverif php artisan migrate --force` | PASS (concerns created) |
| Route middleware | `artisan route:list -vv` | PASS (all 6 routes correct role middleware) |
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| PHP lint + Pint | `pint --test` on changed files | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | No new errors (22 pre-existing only) |
| Tests | `docker exec phpverif ... php artisan test` | PASS (3 passed, 6 assertions) |
| Smoke (RBAC via :8080) | student create 201 → admin list/update (status+reply+resolver) → teacher list 200 → student own-read 200 (sees reply) → student2 other-read 403 → student admin-list 403 → student update 403, then cleaned up test data | PASS |

## Work Completed (2026-09-06, Afternoon) — Timetable Module

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `database\migrations\2026_09_06_000001_create_timetables_table.php` | Created — timetables (class_id, day, period, nullable subject_id/teacher_id, start_time/end_time, unique [class_id, day, period]) | Feature |
| `app\Models\Timetable.php` | Created — belongsTo classes/Subject/Teacher | Feature |
| `app\Http\Controllers\TimetableController.php` | Created — saveTimetable (bulk upsert grid, deletes removed slots, auto-fills teacher from subject), getTimetableByClass, getTimetableByTeacher, updateTimetable, deleteTimetable | Feature |
| `routes\api.php` | Added 5 timetable routes (POST/PUT/DELETE under `role:admin,teacher`; GET by class/teacher under all roles) | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\api\timetable.ts` | Created — saveTimetable, getTimetableByClass, getTimetableByTeacher, updateTimetableEntry, deleteTimetableEntry | Feature |
| `src\types\index.ts` | Added TimetableDay, TimetableSlot, TimetableSlotInput, SaveTimetablePayload, TimetableByTeacherEntry | Feature |
| `src\pages\management\Timetable\TimetableGrid.tsx` | Created — class selector + period×day grid editor (subject per cell), add/remove period rows, bulk save | Feature |
| `src\components\TimetableView.tsx` | Created — read-only period×day grid (subject + teacher + times) | Feature |
| `src\pages\teacher\Timetable.tsx` | Created — teacher's own teaching periods (timetable by teacher_id) | Feature |
| `src\pages\student\Timetable.tsx` | Created — student's own class schedule | Feature |
| `src\routes\AppRouter.tsx` | Added `/management/timetable`, `/teacher/timetable`, `/student/timetable` | Feature |
| `src\components\Sidebar.tsx` | Added Timetable links for management/teacher/student | Feature |

### Verification (2026-09-06, Afternoon)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| PHP syntax + Pint | `php -l` + `pint --test` on changed files | PASS |
| Tests | `docker exec phpverif ... php artisan test` | PASS (3 passed, 6 assertions) |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | No new errors (22 pre-existing only) |
| Migration | `docker exec phpverif php artisan migrate --force` | PASS (timetables created) |
| Smoke (admin) | POST + GET `/api/timetable` via :8080 | PASS |
| Smoke (student read, RBAC) | GET `/api/timetable/class/1` 200; POST `/api/timetable` 403 | PASS |

### Docs (2026-09-06, Afternoon)

| File | Change | Type |
|---|---|---|
| `PROJECT_CONTEXT.md` | Timetable model/controller/routes in API section, migrations count 14→15, page structure + sidebar (Timetable), Work Completed Timetable section + verification table, "Not yet started" → Concerns only, Last verified → 2026-09-06 | Docs |
| `ClassEase_Project_Journal.md` | Module 12 (Timetable), Timetable API table, page tree + nav flow nodes (management/teacher/student timetable), Day 8 afternoon entry, Phase 2 Timetable marked done, removed duplicate Announcements row | Docs |
| `docs\diagrams\6-navigation-flow.png` | Re-rendered via mermaid.ink after nav flow added Timetable nodes | Docs |
## Work Completed (2026-09-07) � Comparative Performance Module
### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| database\migrations\2026_09_07_000001_add_semester_to_scores_table.php | Created - adds `semester` (string, default `current`) to `scores`; unique becomes (student_id, subject_id, exam_type, semester). Idempotent (`hasColumn`/`hasIndex`), adds new unique before dropping old (MySQL Error 1553 FK-index fix) | Feature |
| app\Models\Score.php | Added `semester` to `$fillable` + `@property` docblock (Carbon imported) | Feature |
| app\Http\Controllers\ScoreController.php | addScore validates `semester` (required), updateScore uses `sometimes`; duplicate 409 check now (student_id, subject_id, exam_type, semester) | Feature |
| app\Http\Controllers\LeaderboardController.php | `?semester=` filter (default `current`, echoed in response); fixed `use App\Models\Classes` -> `use App\Models\classes` | Feature + Fix |
| app\Http\Controllers\ComparisonController.php | Created - bySubject (per-student % + is_you + class avg/min/max), gaps (top-3/class gap sorted desc), progress (current vs latest other semester, trend + summary); students scoped to own studentId via isStudentForbidden; flat `Collection<int, Score>` + `@param` docblocks for PHPStan | Feature |
| app\Http\Controllers\StudentController.php | Added `getMyStudent` (auth user -> own Student row -> `GET /student/me`) | Feature + Fix |
| routes\api.php | Added `/student/me` (declared before `/student/{id}`) + 3 comparison routes (read-only group) | Feature |

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| src\types\index.ts | Added Score.semester, LeaderboardResponse.semester, ScoreWithMeta, SubjectComparisonEntry, SubjectComparisonResponse, StudentGap, GapsResponse, ProgressEntry, ProgressResponse | Feature |
| src\api\comparison.ts | Created - getComparisonBySubject, getStudentGaps, getStudentProgress | Feature |
| src\api\leaderboard.ts | getLeaderboardByClass accepts semester param | Feature |
| src\api\students.ts | Added getMyStudent | Feature |
| src\pages\student\Performance.tsx | Created - 3 tabs (vs Classmates / Where to Focus / My Progress); fetches own student via getMyStudent | Feature |
| src\pages\student\Dashboard.tsx | Fixed user-id-vs-student-id bug: now getMyStudent -> own subjects/scores/announcements by real student id (was getStudent(user.id), showed another student) | Fix |
| src\pages\management\Scores\ScoresByClass.tsx | Semester dropdown filter + Semester column | Feature |
| src\pages\management\Scores\AddScore.tsx | Freeform semester input (default `current`) | Feature |
| src\pages\management\Scores\EditScore.tsx | Semester input + payload | Feature |
| src\pages\management\Leaderboard\LeaderboardByClass.tsx | Semester dropdown (options from getScoresByClass) | Feature |
| src\routes\AppRouter.tsx | Route /student/performance | Feature |
| src\components\Sidebar.tsx | Added "Performance" student link | Feature |

### Verification (2026-09-07)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint/format/types | `npm run lint:check` / `format:check` / `types:check` (classEase) | PASS |
| Pint | `pint` on changed files | PASS |
| Tests | `docker exec phpverif ... php artisan test` | PASS (3 passed, 6 assertions) |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code (was 22; 2 Leaderboard controller case fixes) |
| Migration | SQLite in-memory (test env) + docker MySQL | PASS |
| Seed fixture data (live MySQL) | Admin API: 2 subjects for class 1 (1 Physics, 2 Mathematics) + 8 scores (2 students x 2 subjects x current/Fall 2025) | PASS |

Smoke test via :8080 (student1 = user 6 -> student 1, class 1):
- `POST /api/scores` duplicate (student, subject, exam, same semester) -> **409**; same exam different semester -> **201** (allowed). PASS
- `GET /api/student/me` -> Arjun Mehta, id 1, class 1 (NOT user 6). PASS
- `GET /api/comparison/subject/1/1?semester=current` -> Sneha 90% (is_you=false), Arjun 78% (is_you=true), avg 84 / min 78 / max 90. PASS
- `GET /api/comparison/gaps/1?semester=current` -> sorted desc: Mathematics gap 11.5, Physics gap 6. PASS
- `GET /api/comparison/progress/1` -> per-subject previous/current/delta/trend + summary (improved/declined/overall). Student2 accessing `gaps/1` -> **403**. PASS
- `GET /api/leaderboard/class/1?semester=current` and `?semester=Fall 2025` -> correct filtered averages; `GET /api/scores/student/1` includes semester. PASS

### Work Completed (2026-09-07, later) — Head-to-Head comparison

Follow-up to the same session: direct one-vs-one comparison (design Q&A resolved: students + admin/teacher; new Head-to-Head tab; full subjects + semester view).

#### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `app\Http\Controllers\ComparisonController.php` | Added `headToHead($request, $studentAId, $studentBId)` + `studentSubjectPercentage()` helper. Per subject (union of both students' subject ids for the semester): A%, B%, delta, leader (A/B/tie/n-a); results sorted by \|delta\| desc; summary (subjects compared, A wins, B wins, ties). RBAC: students must be one of the pair (else 403) **and same class** (else 403); admin/teacher any two. `studentA_is_you`/`studentB_is_you` flags | Feature |
| `routes\api.php` | Added `GET /comparison/headtohead/{studentA}/{studentB}` (read-only group); moved `GET /student/class/{id}` from `admin,teacher` into the read-only group | Feature |
| `app\Http\Controllers\StudentController.php` | `getAllStudentFromClass` now takes `Request` and blocks students from viewing any class but their own (403) | Feature + Fix |

#### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\types\index.ts` | Added HeadToHeadLeader, HeadToHeadResult, HeadToHeadResponse | Feature |
| `src\api\comparison.ts` | Added getHeadToHead(studentA, studentB, semester?) | Feature |
| `src\pages\student\Performance.tsx` | Role-aware: student keeps 4 tabs (added "Head-to-Head"); staff (`management`/`teacher`) sees only the Head-to-Head tab with Class + Student A + Student B pickers. H2H: classmate/roster select, semester select, matchup header (You badges), summary chips (subjects compared, A wins / B wins / ties), per-subject table (A %, B %, delta + leader badge). Used at /student/performance, /teacher/performance, /management/performance | Feature |
| `src\routes\AppRouter.tsx` | Added /management/performance + /teacher/performance routes | Feature |
| `src\components\Sidebar.tsx` | Added "Performance" links for management + teacher | Feature |

#### Verification (Head-to-Head, 2026-09-07)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint/types | `npm run lint:check` / `types:check` (classEase) | PASS |
| Pint | `pint` | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code |
| Tests | `docker exec phpverif ... php artisan test` | PASS (3 passed, 6 assertions) |
| Smoke (admin) | `GET /comparison/headtohead/1/2?semester=current` | PASS — Math A=65 B=88 delta=-23 leader=B; Physics A=78 B=90 delta=-12 leader=B (sorted by \|delta\| desc); summary subjects=2 A_wins=0 B_wins=2 ties=0 |
| Smoke (admin) | `GET /comparison/headtohead/1/2?semester=Fall%202025` | PASS — Math A=72 B=90; Physics A=70 B=80 |
| Smoke (student self) | `GET /comparison/headtohead/1/2` as student1 | PASS — A_is_you=true, B_is_you=false, results=2 |
| Smoke (RBAC) | student3 on `/comparison/headtohead/1/2` -> **403**; student1 on `/comparison/headtohead/1/6` (class 3 student) -> **403** (same-class rule); missing id 99 -> 404 | PASS |
| Smoke (roster guard) | `GET /student/class/1` as student1 200; `GET /student/class/2` as student1 -> **403** | PASS |

### Work Completed (2026-09-07, later) — Login accounts for admin-created people

Q&A resolved: teachers get logins too; password = the one the admin enters (teacher forms gained a password field); edits stay in sync.

**Background**: login (`POST /api/login`) checks the `users` table only. Admin-created students/teachers only got a `students`/`teachers` row (no `users` row) so they could never log in. Now fixed.

#### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `database\migrations\2026_09_07_000002_add_soft_deletes_to_users_table.php` | Added `deleted_at` to `users` so a person's login can be revoked without hard-deleting (students/teachers tables have `user_id` FK with `cascadeOnDelete`, so hard-deleting the User would cascade-delete the person + scores) | Feature |
| `app\Models\User.php` | Added `SoftDeletes` trait | Feature |
| `app\Http\Controllers\StudentController.php` | `addStudent` — in a transaction creates `User` (role student, name = firstName middleName surname, email, hashed password) then the Student linked via `user_id`; email validated unique in `students` AND `users`. `updateStudent` — email unique in both (ignores own rows); syncs linked User name/email/password (blank keeps current); creates the login for legacy students when a password is supplied. `deleteStudent` soft-deletes the linked User (login revoked). Uses `DB::transaction` + `Rule` | Feature |
| `app\Http\Controllers\TeacherController.php` | `createTeacher` — now requires `password` (min 6) and in a transaction creates `User` (role teacher, same email, linked `user_id`); email unique in both `teachers` and `users`. `updateTeacher` — syncs linked User name/email/password (blank keeps current). `deleteTeacher` soft-deletes the linked User | Feature |

#### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\types\index.ts` | `TeacherInput` now has optional `password` | Feature |
| `src\pages\management\Teachers\AddTeacher.tsx` | Added required "Password" field; subtitle now notes the teacher signs in with the entered email + password | Feature |
| `src\pages\management\Teachers\EditTeacher.tsx` | Added "New password (blank = keep current)" field | Feature |
| `src\pages\management\Students\AddStudent.tsx` | Subtitle notes the student signs in with the entered email + password (password field already existed) | Feature |

**Admin permanence / single admin** (unchanged, now verified by test): public `register` forces `role=student` server-side; no user-management or role-change API exists; the seeder creates exactly one admin (`admin@classease.com`, `updateOrCreate`, permanent); account creation is admin-only (`role:admin` middleware on all student/teacher create/update/delete routes).

#### Verification (Login accounts, 2026-09-07)

| Check | Command | Result |
|---|---|---|
| Pint | `pint` on changed files | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code |
| Tests | `docker exec phpverif ... php artisan test` | PASS — **12 passed, 44 assertions** (new `LoginAccountTest` 7: student+teacher login created & loginable, password sync, email sync, email collision 422, delete revokes login, register can't make an admin) |
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint | `npm run lint:check` (classEase) | PASS |
| Migration | `docker compose exec app php artisan migrate --force` (live MySQL) | PASS |
| Smoke (live :8080) | admin creates student -> `POST /login` as student | PASS — role student, name "Smoke Student" |
| Smoke (live :8080) | admin creates teacher (with password) -> `POST /login` as teacher | PASS — role teacher, name "Smoke Teacher" |
| Smoke (live :8080) | admin deletes the student -> `POST /login` with same creds | PASS — 422 (revoked) |

#### Dashboard notices & tasks feed (2026-09-07)

**Request**: show all notices + all tasks with deadlines on every role's dashboard.

**Design**: new `GET /dashboard/feed` returns `{ message, announcements, homeworks }`. Role scoping (see DashboardController above). Student = own class homework only + general notices; teacher = own classes + general + homework they assigned; admin = everything. Deadlines shown on every task ("Overdue" if due < today, "Due today" otherwise) via shared `NoticesTasks.tsx` component (two cards: "Notices (n)" and "Tasks & Deadlines (n)").

**Latent bug found & fixed**: `Homework` model defaulted to table `homework` (Eloquent treats "homework" as uncountable) while the migration + live DB use `homeworks` — homework reads/writes would have failed 500. Fix: explicit `protected $table = 'homeworks';`. Separately, `POST /homework` requires `assigned_by` (teacher FK, NOT NULL) resolved from the caller's teacher profile — so an **admin cannot create homework** (no teacher profile → 500); homework creation is effectively a teacher action (the UI only exposes it to teachers). **[FIXED 2026-09-08: `assigned_by` made nullable — see "Homework fix + teacher homework pages" below.]**

#### Verification (Dashboard feed, 2026-09-07)

| Check | Command | Result |
|---|---|---|
| Pint | `pint` on changed files | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code |
| Tests | `docker exec phpverif ... php artisan test` | PASS — 12 passed, 44 assertions (new `DashboardFeedTest` 2: admin sees all; student sees only class + general) |
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint | `npm run lint:check` (classEase) | PASS |
| JS format | `npm run format:check` (classEase) | PASS |
| JS types | `npm run types:check` (classEase) | PASS |
| Smoke (live :8080) | admin posts general + class-1 notice, teacher1 posts homework for class 1 | PASS |
| Smoke (live :8080) | `GET /dashboard/feed` as teacher1 | PASS — 3 notices + 1 task (own homework) |
| Smoke (live :8080) | `GET /dashboard/feed` as student1 | PASS — 3 notices (general + class 1) + 1 task (class 1) |
| Smoke (live :8080) | `GET /dashboard/feed` as admin | PASS — 3 notices + 1 task (everything) |

#### Teacher classroom features: notices, timetable, marks (2026-09-07)

**Request**: "teacher should also announce the notice, set the timetable, enter marks like basic teacher functionality".

**Gap**: backend routes already allowed `admin,teacher` for announcements/scores/timetable writes, but the teacher UI only had Dashboard / read-only Timetable / Concerns / Performance. Also `GET /classes` and `GET /subjects` are **admin-only**, so teacher pages could not use the management page data calls.

**Built (client, teacher role)**:
- `Announcements.tsx` (`/teacher/announcements`) — inline post form (audience = general or the teacher's classes) + list with Edit (prefills form → `updateAnnouncement`) / Delete.
- `Marks.tsx` (`/teacher/scores`, label "Marks") — class + subject selectors **scoped to the teacher's own classes/subjects** (derived from `getTeacherSubjects`), roster via `/student/class/{id}`, add/edit/delete scores per exam + semester with duplicate-409 handling.
- `Timetable.tsx` — upgraded from read-only to a class **editor** (TS grid mirrors management `TimetableGrid` except class list = teacher's classes and subject options = all subjects of the selected class via new `getSubjectsByClass`); keeps a "Your periods this week" read-only view below.

**Backend**:
- `GET /teacher/me` (`TeacherController::getTeacherMe`) — resolves the authenticated user's own teacher profile. **Pre-existing bug fixed**: teacher id ≠ user id in the seed, and teacher Dashboard/Timetable previously used `user.id` as the teacher id, so seeded teachers saw another teacher's data / empty subjects.
- `GET /subjects/class/{classId}` (`SubjectController::getSubjectsByClass`) — subjects of one class (with class + teacher), for the teacher timetable editor.

**Note**: backend write routes for announcements/scores/timetable are `role:admin,teacher` with no per-subject/per-class ownership guard — the *UI* scopes teachers to their own classes/subjects, but the API itself is not hardened.

#### Verification (Teacher classroom features, 2026-09-07)

| Check | Command | Result |
|---|---|---|
| Pint | `pint` on changed files | PASS |
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code |
| Tests | `docker exec phpverif ... php artisan test` | PASS — **16 passed, 59 assertions** (+4 `TeacherWorkflowTest`: `/teacher/me`, post announcement, record score, save timetable — all as a teacher) |
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| JS lint | `npm run lint:check` (classEase) | PASS |
| Smoke (live :8080) | login teacher3 → `GET /teacher/me` | PASS — id 3 (Amit Verma; user id is different), confirms the teacher-id fix |
| Smoke (live :8080) | `GET /teacher/3/subjects` | PASS — Physics + Mathematics for B.Sc CS (class 1) |
| Smoke (live :8080) | teacher3 `POST /announcements` (class 1) | PASS |
| Smoke (live :8080) | teacher3 `POST /scores` (Math, Arjun) | PASS — recorded, then cleaned up |
| Smoke (live :8080) | teacher3 `POST /timetable` (class 1) | PASS — slot saved, then cleaned up |

#### Class ranking for students + leaderboard rank bug (2026-09-07)

**Request**: whole-class comparison — students should see their **personal rank in the class**, and admins
should see who is on top (admin already had the Leaderboard page at `/management/leaderboard`).

**Built (client)**:
- Student `Performance.tsx` gained a **Class Rank** tab (5 tabs now). It calls the existing
  `GET /leaderboard/class/{classId}` (semester + exam filters), shows a summary row (your rank #N of M,
  your average, class topper) and the full ranked table with the student's row highlighted + "You" badge.
- Admin "who is on top" was already covered by `LeaderboardByClass.tsx` (`/management/leaderboard`),
  wired in router + sidebar — nothing new needed there.

**Backend bug fixed — rank was never serialized**: `LeaderboardController::getLeaderboardByClass`
computed ranks with `foreach ($leaderboard as &$entry)` — a by-reference loop over a Collection, which
does **not** write back into the collection items, so `rank` was missing from every entry's JSON (the
admin leaderboard page's rank badges were blank too). Replaced with a `->map()` that injects `rank`.

**Tests**: new `tests/Feature/LeaderboardTest.php` — 2 tests: correct descending order with ranks,
and omission of students without scores for the selected semester.

**Note**: leaderboard groups only students who **have** scores for the selected semester/exam; a student
with none is "Unranked" (shown as such, not at the bottom).

#### Verification (Class ranking, 2026-09-07)

| Check | Command | Result |
|---|---|---|
| Pint | `pint` on `LeaderboardController.php` + new test | PASS |
| PHPStan (lvl 7, app scope only) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code |
| Tests | `docker exec phpverif ... php artisan test` | PASS — **18 passed, 71 assertions** (+2 `LeaderboardTest`) |
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| Smoke (live :5174) | `GET /leaderboard/class/1?semester=current` as student1 | PASS — ranks now present: #1 Sneha Joshi 89%, #2 Arjun Mehta 71.5% (student1 = Arjun, rank 2) |

#### Email reuse after deleting a teacher/student (2026-09-07)

**Report**: after deleting a teacher, re-adding the **same email** failed with "The email has already been taken."

**Root cause**: `teachers.email`, `students.email` and `users.email` have DB unique indexes, and all three tables
use `SoftDeletes`. Deleting a teacher soft-deleted the teacher row **and** the linked `User` login (`->delete()`),
so both unique indexes still contained the email → create + update validation (and the DB itself) rejected it.

**Fix**:
- Migration `2026_09_07_000003_allow_email_reuse_after_delete` (18→19): dropped the unique indexes on
  `teachers.email`, `students.email`, `users.email`, and purged already-soft-deleted `user` rows so freed
  emails unlock immediately.
- Uniqueness is now enforced in **app validation only against non-deleted rows**:
  `Rule::unique(...)->whereNull('deleted_at')` in `createTeacher`/`updateTeacher`, `addStudent`/`updateStudent`,
  and public `register` (users). Deleting a teacher/student now `forceDelete()`s the linked login user (email
  fully freed) while keeping the teacher/student row soft-deleted for the record.
- **Tests** (`LoginAccountTest`, +2): deleted teacher email reusable (old login removed, new login logs in);
  deleted student email reusable.

**Note**: running `docker exec phpverif php artisan migrate:fresh --seed --env=testing` operates on the **live
MySQL** (compose env vars override `.env` DB settings), which re-seeded the live DB back to canonical
ClassEaseTestDataSeeder content during this work.

#### Verification (Email reuse, 2026-09-07)

| Check | Command | Result |
|---|---|---|
| Pint | `pint` on the 3 controllers + new migration + test | PASS |
| PHPStan (lvl 7, app scope only) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | 20 errors, ALL pre-existing, 0 in new code |
| Tests | `docker exec phpverif ... php artisan test` | PASS — **20 passed, 81 assertions** (+2 email-reuse tests) |
| Migration on live MySQL | `docker compose exec app php artisan migrate` | Ran (000003 present in `migrate:status`) |
| Smoke (live :8080) | admin create teacher → delete → re-create **same email** | PASS — email reused (old login gone, new login works; smoke rows cleaned up) |

### Docs (2026-09-07)

| File | Change | Type |
|---|---|---|
| PROJECT_CONTEXT.md | Designs marked DONE, resolved open questions, Score model + new unique, ComparisonController + getMyStudent in API section, comparison + /student/me routes + route-order note, migrations 16->17, page structure + sidebar (Performance), PHPStan 22->20, What-to-Do-Next updated, Work Completed section, Last verified -> 2026-09-07 | Docs |
| PROJECT_CONTEXT.md | Head-to-Head sub-section: endpoint + RBAC (student must be one of pair + same class), roster guard for students, staff Performance routes/sidebar, verification table, encoding fix (file was double-encoded by a PowerShell script; recovered via UTF-8 -> Windows-1252 round-trip) | Docs |
| PROJECT_CONTEXT.md | Login-accounts sub-section: User SoftDeletes migration (17->18), Student/Teacher controller login create/sync/revoke + teacher password field, admin-only & single-admin guarantees, LoginAccountTest (10 tests / 36 assertions), live smoke results | Docs |
| PROJECT_CONTEXT.md | Dashboard feed sub-section: DashboardController::getFeed scoping per role, Homework model `$table = 'homeworks'` latent-bug fix (uncountable pluralization), admin-can't-create-homework note, NoticesTasks component + dashboard wiring, verification table (12 tests / 44 assertions), docs row | Docs |
| PROJECT_CONTEXT.md | Teacher classroom sub-section: /teacher/me + teacher-id != user-id latent fix, /subjects/class/{id}, teacher Announcements/Marks/Timetable pages, sidebar + routes, TeacherWorkflowTest (16 tests / 59 assertions), no backend ownership-guard note, verification table, docs row | Docs |
| PROJECT_CONTEXT.md | Add-teacher silent failure root cause: stale Vite dev server on 5174 (bind-mount changes not watched on Windows) → served the pre-password-field AddTeacher page; submitted `password: undefined` → 422 with no field to render it. Fixed with `server.watch.usePolling` + container restart; NOTE added in Docker gotchas. | Docs |
| PROJECT_CONTEXT.md | `PasswordInput.tsx` Show/Hide toggle added; swapped into AddTeacher/EditTeacher/AddStudent/EditStudent password fields | Feature |
| PROJECT_CONTEXT.md | Class-ranking sub-section: student Performance "Class Rank" tab (own rank #N of M + full ranked table with You highlighted), admin Leaderboard already existed, LeaderboardController rank-not-serialized bug (`foreach &$entry` writes nothing back into a Collection → rank missing from JSON) fixed via ->map(), LeaderboardTest (18 tests / 71 assertions), verification table, docs row | Docs |
| PROJECT_CONTEXT.md | Email-reuse-after-delete sub-section: dropped teachers/students/users email unique indexes + purged soft-deleted users (migration 18->19), validation now Rule::unique(...,)->whereNull('deleted_at') on teacher/student create+update and register, delete teacher/student forceDeletes the linked login User, LoginAccountTest +2 (20 tests / 81 assertions), live DB re-seeded to canonical seed during migrate:fresh, verification table, docs row | Docs |
| PROJECT_CONTEXT.md | Sequential "No." column added to management Teachers list (`idx + 1` row count, not the raw DB id — auto-increment PK jumps to 6,7 after create→delete cycles and is unsafe to renumber because classes.class_teacher, subjects.teacherId, homeworks.assigned_by and time table rows reference teacher id); client build PASS, :5174 verifies serving updated module | Feature |

## Work Completed (2026-09-08) — PHPStan cleanup (all 20 pre-existing errors fixed)

Resumed yesterday's remaining process: the 20 pre-existing PHPStan (lvl 7) errors were the only
quality blocker left after all planned modules shipped. All now fixed.

### Backend (classEase/)

| File | Change | Type |
|---|---|---|
| `app\Models\Student.php` | Added missing `attendance()` `HasMany<Attendance, $this>` relation (`student_id`) — was eagerly loaded in AttendanceController but never defined on the model (5 of the 20 errors: relation-existence + undefined-property + nullsafe) | Fix |
| `app\Http\Controllers\AttendanceController.php` | After the relation was added, removed the now-unnecessary trailing `?? null` on the `attendance->first()?->status/remarks` lines (first() already returns nullable; nullsafe is valid and PHPStan-clean) | Fix |
| `app\Http\Controllers\SubjectController.php` | Typed all 5 methods: `int $id` params on getSubject/updateSubject/deleteSubject + `: JsonResponse` returns on getAllSubjects/getSubject/createSubject/updateSubject/deleteSubject. Typing `$id` as `int` makes `Subject::find(int)` resolve to `Subject|null` (not the `Subject|Collection` union), clearing the two `method.notFound` `update(`/`delete(` errors | Fix |
| `app\Http\Controllers\StudentController.php` | `getStudentSubjects` → `getStudentSubjects(int $id): JsonResponse` (untyped `$id` was cascading a `Student\|Collection` union into `$student->classId`) | Fix |
| `app\Http\Controllers\TeacherController.php` | `getTeacherSubjects` → `getTeacherSubjects(int $id): JsonResponse` | Fix |

### Verification (2026-09-08)

| Check | Command | Result |
|---|---|---|
| PHPStan (lvl 7) | `docker exec phpverif php vendor/bin/phpstan analyse --no-progress` | **PASS — `[OK] No errors`** (was 20) |
| Pint | `vendor\bin\pint --test` on the 5 changed files | PASS |
| Tests | `docker exec phpverif ... php artisan test` | PASS — 20 passed, 81 assertions (unchanged) |
| Wayfinder regeneration | `docker exec phpverif php artisan wayfinder:generate --with-form` | PASS — regenerated `resources/js/actions/` + `resources/js/routes/` (gitignored artifacts; the classEase Inertia pages don't import wayfinder routes) |

### Docs (2026-09-08)

| File | Change | Type |
|---|---|---|
| PROJECT_CONTEXT.md | Blocker marked RESOLVED with the fix details; Verified Green Baseline PHPStan row updated to PASS (0 errors); "All planned modules complete" note updated; Wayfinder regeneration marked DONE with note; "What to Do Next" cleaned; Last verified → 2026-09-08 | Docs |

With this, all planned modules are complete **and** all pre-existing PHPStan errors are resolved — a fully green backend verification baseline (Pint + PHPStan + 20 tests).

## Work Completed (2026-09-08, later) — Attractive dashboard UI with charts (all roles)

Rebuilt the three role dashboards with rich, first-impression-friendly graphical representations using
**Recharts**. Data scoping matches each role: student sees their own whole subject set + all their things;
teacher sees their own subject + class; admin sees everything school-wide.

### Dependency

| Change | Type |
|---|---|
| `client/package.json` + `package-lock.json` | **Added `recharts ^3.10.1`** (installed on host + inside Docker `classease-client` via `docker exec ... npm install`). NOTE: the client container keeps its own `client-node-modules` volume, so new client deps must be installed inside the container too (host `npm install` alone doesn't reach it), then `docker compose restart client` to pick up new source + deps (Windows bind-mount staleness gotcha) | Feature |

### Backend
None. All data comes from existing endpoints (scores, leaderboard, attendance, comparison gaps/progress, dashboard feed, classes, students-by-class, subjects).

### Frontend (client/)

| File | Change | Type |
|---|---|---|
| `src\components\charts\ChartCard.tsx` (new) | Reusable titled card wrapper (title/subtitle/right slot/body) with consistent surface/border/shadow styling | Feature |
| `src\components\charts\palette.ts` (new) | Chart palette constants (CHART_COLORS incl. ink/ink2/gold/success/danger/warning/border, SERIES, PIE_COLORS, RADIAL_COLORS, TOOLTIP_STYLE) + `fmt(value, unit?)` helper returning a Recharts-formatter-safe `[string,string]` tuple (avoids the `ValueType | undefined` TS friction) | Feature |
| `src\pages\student\Dashboard.tsx` | **Redesigned.** Top stat strip (Class Rank, Overall Average, Attendance Rate, Pending Tasks). Class Rank donut gauge (your avg % ring). Attendance pie chart (present/absent/late + rate). Subject Performance horizontal bar chart (%-per-subject, colored by band). You-vs-Class-Average grouped bar (Me / Class avg / Top 3) from `gaps`. Progress-Over-Time grouped bar (Previous vs Current) + per-subject trend arrows from `progress`. Homework overview cards (overdue/due-today/upcoming) + subject progress bars. Kept NoticesTasks. Fetches leaderboard/gaps/progress/attendance/scores via `getMyStudent().id` | Feature |
| `src\pages\teacher\Dashboard.tsx` | **Redesigned.** Top stat strip (Subjects, Today's Attendance %, Students in Class, Pending Tasks). Your Profile card. Today's Attendance pie (from `getAttendanceByClass(primaryClass, today)`). Class Performance by Subject bar chart (avg % per subject taught). Per-Student Performance horizontal bar with subject selector (scores for the selected subject). Subjects-you-teach cards with avg % bars. Kept NoticesTasks. Uses `getTeacherMe()`→teacher id (not user id), scoped to the teacher's first subject's class | Feature |
| `src\pages\management\Dashboard.tsx` | **Redesigned.** Keeps 4 stat cards. Students-per-Class bar chart (from `getClasses` + `getStudentsByClass` per class). Class Performance bar chart (avg % per class from `getScoresByClass`). Scores-Distribution-by-Subject horizontal bar (record counts). Kept NoticesTasks | Feature |

Chart variety used: **donut/radial** (rank gauge, attendance), **horizontal bar** (subject %, per-student), **grouped bar** (you vs class, progress), **vertical bar** (class perf, students/class), **mini progress bar** (subject list) — selected per the data shape.

### Verification (2026-09-08)

| Check | Command | Result |
|---|---|---|
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS |
| Docker client dep install | `docker exec classease-client npm install` (picks up recharts) | PASS |
| Dev-server restart | `docker compose restart client` | PASS |
| Vite transform smoke (:5174) | GET the 3 dashboard modules + `charts/palette.ts` + recharts pre-bundled dep | PASS (all HTTP 200) |
| Endpoint smoke (:8080, live MySQL) | student1 → leaderboard(2), gaps(2), scores(2), feed; teacher3 → /teacher/me, 3 subjects, scores/class; admin → 3 classes, students/class (3/2/2) | PASS — dashboards have live data |

### Docs (2026-09-08)

| File | Change | Type |
|---|---|---|
| PROJECT_CONTEXT.md | Dashboard redesign sub-section: recharts dep + Docker install/restart note, per-role chart data + chart-type mapping, verification table, last-verified date | Docs |

Chunk-size note: Recharts adds ~600kB dev / ~200kB gzipped to the client bundle; the build emits a
>500kB chunk warning (non-fatal, no code-splitting configured yet).

## UI/UX REDESIGN PLAN (2026-09-08) — E-Learning Bento Dashboard

> **PERSISTENT CHECKPOINT — resume from here if interrupted.** Source of inspiration: an e-learning
> admin dashboard. Goal: make all 3 role dashboards more attractive using a bento-grid analytics layout.
> Implement in this order; each role is independent so partial completion is safe.

### Design System (from the reference spec)
- **Layout:** Bento-grid fluid layout, rounded soft-corner containers (12–16px radius), 16/24px spacing grid, desktop-first (1440px), responsive down to mobile.
- **Primary accent:** Teal `#2E9B9A` (hero banner). Supporting accents: Yellow `#FFD014` (completed), Pink `#FF3E6C` (video/CTA), plus existing ink/gold/success/danger palette.
- **Hero banner:** full-width horizontal card, teal bg, bold dynamic promo text, KPI badges (Total Students / Expert Mentors) with circular flat-icon wrappers.
- **Charts:** area-spline line (6-month progress trend), vertical bar list ("Top 5"), donut/ring split, sparkline with %-delta badge.
- **Cards rows:** [icon-badge] → [title+subtitle] → [action button].

### Role-specific mapping (data sources = existing endpoints)
- **Management** = the "admin/e-learning" reference most closely:
  - Hero: Total Students + Total Teachers (or Experts) KPI badges, promo text.
  - Quick counters: Courses/Subjects count, Classes.
  - "Popular Courses" → Subjects list (subjectName + class + teacher + avg%).
  - "Current Activity" → area/line chart of score volume or avg% trend over last 6 months (from scores created_at).
  - "Top 5 School Performance" → 5-item vertical bar (top 5 subjects by avg%, or classes).
  - "Overall Pass Percentage" → donut (pass/needs-work split).
  - "Best Instructors" → teachers (name + subject/class count + courses button).
  - "Content Usage" → sparkline of scores recorded over time + delta badge.
- **Teacher** = scoped to her subject + class:
  - Hero: her subject count + class students KPI.
  - "Current Activity" → her class avg trend over 6 months.
  - "Top 5" → top 5 students in her subject (bar).
  - "Pass %" → donut for her subject.
  - "Popular Courses" → subjects she teaches.
  - "Best Instructors" n/a (teacher is the instructor) → could show her class roster.
- **Student** = her own things:
  - Hero: her class, rank KPI.
  - "Current Activity" → her % trend over semesters/6 months (line).
  - "Top 5" → her subject performance comparison vs top of class.
  - "Pass %" → her attendance donut + overall.
  - "Popular Courses" → her subjects.
  - Keep existing class-rank donut + homework + NoticesTasks.

### Where to put shared tokens/helpers
- Extend `client/src/components/charts/palette.ts`: add teal `#2E9B9A`, yellow `#FFD014`, pink `#FF3E6C`, `BORDER_RADIUS=16`, `TEAL_GRADIENT`.
- New shared components under `client/src/components/dashboard/`: `HeroBanner.tsx`, `KpiBadge.tsx`, `MetricRow.tsx`, `ListRow.tsx`, `TrendChart.tsx` (area), `Top5Bar.tsx`, `PassDonut.tsx`, `Sparkline.tsx`.
- Reuse existing `ChartCard.tsx`.

### Gotchas / reminders
- After changing client code: `docker exec classease-client npm install` only if new deps (recharts already present); then `docker compose restart client`; hard-refresh (Ctrl+F5) — Windows bind-mount staleness.
- Recharts Tooltip `formatter` must use `fmt(value)` helper (ValueType TS friction) — don't inline `(value: number)`.
- Verify: `npm run build` (tsc+vite) from `client/`, then smoke via :5174 + endpoint tests.
- Update this plan + page-structure + Work Completed when done. Update "Last verified".

## BENTO REDESIGN + TEACHER ATTENDANCE � COMPLETED (2026-09-08)

Two-part feature, both done and verified (see UI/UX plan above for the original spec).

### Teacher Mark Attendance
- Backend already allowed teachers: POST /attendance and PUT /attendance/{id} are under role:admin,teacher (routes/api.php). NO backend change needed.
- Added client/src/pages/teacher/MarkAttendance.tsx: loads teacher's subjects via getTeacherMe() -> getTeacherSubjects(id), derives unique classes (cast subject.class to a local TeacherClass { id, class_name, section } because ClassSummary lacks section), pickers for class + date, present/absent/late toggle rows, save via markAttendance(). Mirrors the management MarkAttendance UX.
- Wired: route /teacher/attendance in routes/AppRouter.tsx + sidebar link in components/Sidebar.tsx.

### Bento redesign (all 3 role dashboards)
- Shared client/src/components/dashboard/: HeroBanner.tsx (+ KpiBadge), Card.tsx (bento card w/ title/subtitle/action, BENTO_RADIUS=16), ListRow.tsx, MetricRow.tsx, TrendChart.tsx (area-spline, uses TEAL_GRADIENT), Top5Bar.tsx (color-coded vertical bar, teal/gold/yellow/pink/inkLight), PassDonut.tsx (donut + center label), Sparkline.tsx (+ delta badge), icons.tsx (shared icon set).
- Tailwind: added teal/yellow/pink to client/tailwind.config.js colors (was missing). Added AXIS_TICK to charts/palette.ts. ChartCard.tsx now UNUSED (kept for reference).
- All three dashboards rebuilt: teal HeroBanner + KPI badges, 12-col bento grid with Popular Courses (ListRows) / Current Activity (6-month avg % area from scores created_at) / Overall Pass % (donut), then Top 5 (bar) / Content Usage (sparkline w/ delta) / Attendance donut, plus existing charts + NoticesTasks retained. Teacher and management import ICONS from components/dashboard/icons.tsx.
- DatedScore = ScoreFull & { created_at? }; month bucketing via monthKey/monthLabel helpers in each dashboard.

### Verification (2026-09-08)
- npm run build (tsc + vite) PASS.
- docker compose restart client PASS; Vite 200 on / + all new modules transform 200 (:5174). Tailwind CSS regenerated (teal classes present).
- Live endpoint smoke prior session confirmed student1/teacher3/admin login + data availability.

Remaining/optional: code-split recharts (>500kB chunk warning), clean up unused ChartCard.tsx, add section to teacher attendance UI, Popover styling for Card action slots.

## DASHBOARD ITERATION 2 � RESPONSIVE + THEME COLORS + BLEND (2026-09-08)

User feedback on the bento redesign: (1) it overflowed margins on smaller screens, (2) it leaned too hard on the 3 new accent colors (teal/yellow/pink) instead of the established theme palette, (3) blend the user's bento idea WITH the assistant's earlier idea set (rank gauge, you-vs-class, progress, per-student bars, distribution charts).

### Changes
- **Responsive:** Card root is now flex min-w-0 flex-col + overflow hidden; chart shells (CategoryBars/GroupedBars) wrap ResponsiveContainer in min-w-0 with fixed height; dashboard grids step 1col -> md:grid-cols-6 (courses=3/activity=6/pass=3) -> xl:grid-cols-12; bottom rows md:2 / xl:3-4; long Y/category labels truncated (truncateLabel, tickFormatter); all dashboards root min-w-0 space-y-6.
- **Theme colors:** new ACCENT_SEQUENCE = [gold, ink, success, warning, teal, danger] in palette.ts; Top5Bar + CategoryBars cycle that; PassDonut default = success/danger; attendance donut = success/danger/warning; Current Activity trend colors per role: management=gold, teacher=ink, student=success; KpiBadge accent prop (default gold) so hero badge icons use varied theme colors; hero banner stays teal (accepted accent). ChartCard is now fully unused (kept).
- **Components added:** components/dashboard/CategoryBars.tsx (horizontal single-series bars: accent or solid color, truncation, domain/maxY) and GroupedBars.tsx (vertical multi-series with label truncation). TrendChart gained color + name props (unique gradient id). Top5Bar gained width prop. PassDonut default colors success/danger.
- **Management dashboard:** + Students-per-Class (ink bars), + Class Performance (CategoryBars %), khakis Best Instructors retained; layout rows: hero | courses/activity/pass | top5/students-per-class/content | class-performance/best-instructors | NoticesTasks.
- **Teacher dashboard:** + Class Performance by Subject (CategoryBars) + full Per-Student Performance with subject selector (shared selector with Top 5); rows: hero | courses/activity/pass | top5/class-perf/content | per-student/attendance | NoticesTasks.
- **Student dashboard:** restored + Class Rank gauge (PassDonut gold ring), + Subject Performance bars, + You-vs-Class (GroupedBars Me=gold/Class=ink/Top3=goldLight), + Progress Over Time (Previous=muted/Current=success), Homework Overview w/ delta badge; rows: hero | courses/activity/pass | top5/rank-gauge/content/attendance (xl:4) | you-vs-class/homework | subject-perf/progress | NoticesTasks.

### Verification (2026-09-08)
- npm run build (tsc + vite) PASS. Vite :5174 returns 200 for all 3 dashboards + new components; CSS regenerated (~31KB).
- Reminder: hard-refresh Ctrl+F5 after client edits (bind-mount).


## DASHBOARD ITERATION 3 � ACCURATE THEME COLORS + ANALYTICS DETAIL PAGES (2026-09-08)

User feedback on iteration 2: (1) the design looked too different from the project, (2) hero/header must use the existing theme colors, (3) Current Activity chart looked broken/unresponsive, (4) graph colors looked wrong � use proper professional colors (green/red/blue) that fit the project theme. Then a new request: every graph should have a separate DETAIL page (e.g. Class Performance in detail, Best Instructors in detail).

### Color / chart fixes
- HeroBanner now uses INK_GRADIENT (#1E2A4A -> #33456F navy, matches theme), no more teal header.
- Added CHART_COLORS.blue (#2F6FED) to palette; ACCENT_SEQUENCE = [blue, success, gold, danger, ink, warning] (teal/yellow/pink removed from chart cycles).
- TrendChart: default/professional blue, fixed margins (removed negative-left clipping), Y axis width 36, empty-state + single-point handling, maxLabel option restored.
- CategoryBars now solid single color (default blue) by default � no rainbow per bar.
- All dashboards: Current Activity + Content Usage sparklines use blue; You-vs-Class = Me blue / Class avg gold / Top 3 green; Pass donuts stay success/danger; attendance success/danger/warning; rank gauge gold.

### Analytics detail pages (new 12 pages + shared lib)
- Shared: pages/analytics/{metrics.ts, AnalyticsHeader.tsx, StatCard.tsx, DataTable.tsx (generic, index-aware renders), useManagementData.ts, useTeacherData.ts, useStudentData.ts}.
- Management (/management/analytics/*): activity (monthly avg trend + volume + month table), subjects (full ranking + top5 + pass rates), class-performance (class select, per-class stats, class comparison bars, per-subject breakdown, pass donut, top-10 leaderboard), instructors (per-teacher avg, subjects taught, classes, pass rates, top5).
- Teacher (/teacher/analytics/*): students (per-student ranking for a subject, best/worst, status), class-performance (subjects taught across classes, monthly trend, table), attendance (date+class register, split donut, per-student status table).
- Student (/student/analytics/*): subjects (per-subject breakdown + recent 30 assessments), rank (full class leaderboard, you highlighted), comparison (You vs Class avg vs Top 3 chart + gaps table), progress (previous/current grouped bars + deltas), attendance (summary donut + full history).
- Every dashboard chart card now has a View-details / link action to its detail page.

### Verification (2026-09-08)
- npm run build (tsc + vite) PASS after fixes. Vite :5174 returns 200 for all 20 new modules (routes, shared lib, 12 pages). CSS regenerated (~19.7KB).
- Reminder: hard-refresh Ctrl+F5 after client edits (bind-mount).


## WORK COMPLETED (2026-09-08, later) — HOMEWORK FIX + TEACHER HOMEWORK PAGES

Report: "homework is not working, and teacher can also assign homework for their subject".

### Root cause of "homework not working"
`homeworks.assigned_by` is a **NOT NULL** FK (`foreignId(...)`), but `HomeworkController::createHomework`
set it from `Teacher::where('user_id', $request->user()->id)->first()?->id`, which is **null for admin
users** (no teacher profile linked). Result: every **admin/management create attempt → SQL NOT NULL
violation → 500**. Teachers already *could* create (they resolve to a teacher row), but had **no UI** for it.

### Backend fixes
- `2026_09_04_000002_create_homeworks_table.php` — `assigned_by` now `->nullable()` (fresh installs).
- NEW migration `2026_09_08_000001_make_homeworks_assigned_by_nullable.php` — `->nullable()->change()`
  on the live/migrated DB; applied to MySQL via `docker compose exec app php artisan migrate --force`.
- `HomeworkController` ownership guards (admins unrestricted; teachers restricted):
  - `createHomework` — teachers may only assign for **their own subjects** (`subject.teacherId === teacher.id`),
    else 403. `assigned_by` stays `$teacher?->id`.
  - `updateHomework` / `deleteHomework` — teachers may only touch homework **they assigned**
    (`assigned_by === teacher.id`), else 403; update re-checks `subject_id` ownership if provided.

### Teacher homework UI (client/)
- NEW `pages/teacher/Homework/HomeworkList.tsx` (`/teacher/homework`) — class selector scoped to the
  teacher's classes (derived from `getTeacherSubjects`), lists homework via `getHomeworkByClass`; Edit/Delete
  shown only for homework the teacher assigned (`assigned_by === me.id`), others show "by <teacher>/admin".
- NEW `pages/teacher/Homework/AddHomework.tsx` (`/teacher/homework/new`) — subject select limited to the
  teacher's own subjects; class auto-derived from selected subject's `class.id`; create via `createHomework`.
- NEW `pages/teacher/Homework/EditHomework.tsx` (`/teacher/homework/:id/edit`) — redirects to the list if the
  homework isn't the teacher's own subject/assignment; subject select limited to own subjects; update via
  `updateHomework`.
- Routes in `routes/AppRouter.tsx` (3, under teacher group) + sidebar link "Homework" in `components/Sidebar.tsx`.

### Verification (2026-09-08)
| Check | Command | Result |
|---|---|---|
| Pint | `docker exec phpverif composer lint:check` (80 files) | PASS (migration auto-fixed by pint) |
| PHPStan (lvl 7) | `docker exec phpverif composer types:check` | PASS — `[OK] No errors` |
| Tests | `docker exec phpverif ... php artisan test` | PASS — **20 passed, 81 assertions** |
| Migration (live MySQL) | `docker compose exec app php artisan migrate --force` | PASS (000001 nullable) |
| Smoke (live :8080) | admin `POST /homework` (class 1) | PASS — 201, `assigned_by=null`, then deleted (was 500 before) |
| Smoke (live :8080) | teacher3 login → `GET /teacher/me` (id 6) → `POST /homework` own subject | PASS — 201 `assigned_by=6`, present in `GET /homework/class/{id}`, deleted |
| Smoke (live :8080) | teacher3 `POST /homework` for **another teacher's subject** | PASS — **403** |
| Client build (tsc + vite) | `npm run build` (from `client/`) | PASS (742 modules) |
| Dev-server restart | `docker compose restart client` | PASS |
| Vite smoke (:5174) | `/`, `/teacher/homework`, `/teacher/homework/new`, `/teacher/homework/1/edit` | PASS (all 200) |

