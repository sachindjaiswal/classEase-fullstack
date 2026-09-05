# ClassEase — Project Journal

---

**Project Title:** ClassEase — School Management System

**Prepared By:** Shaikh Farhan

**Date Started:** August 2026

**Last Updated:** September 4, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Database Design](#6-database-design)
7. [Project Structure](#7-project-structure)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Features Implemented](#9-features-implemented)
10. [API Endpoints](#10-api-endpoints)
11. [Frontend Pages](#11-frontend-pages)
12. [Daily Progress Log](#12-daily-progress-log)
13. [Future Scope](#13-future-scope)

---

## 1. Project Overview

**ClassEase** is a comprehensive school management system designed to streamline administrative tasks, teacher workflows, and student engagement. It provides role-based dashboards for management, teachers, and students, enabling efficient handling of classes, subjects, attendance, homework, and more.

The system is built as a full-stack web application with a Laravel 13 backend API and a standalone React SPA frontend, communicating via RESTful API endpoints secured with Laravel Sanctum authentication.

---

## 2. Problem Statement

Traditional school management involves manual paperwork, scattered data, and inefficient communication between administration, teachers, and students. Key challenges include:

- **Attendance Tracking:** Manual attendance registers are prone to errors and take valuable class time.
- **Homework Management:** Teachers struggle to assign and track homework across multiple classes.
- **Data Silos:** Student, teacher, and class data often exist in separate systems.
- **Lack of Real-time Insights:** Administrators lack instant visibility into school metrics.
- **Communication Gap:** No centralized platform for announcements and concerns.

ClassEase addresses these challenges by providing a unified digital platform with role-based access.

---

## 3. Objectives

### Primary Objectives

1. Build a centralized platform for managing school operations
2. Implement role-based access control (Management, Teacher, Student)
3. Digitize attendance tracking with bulk marking capability
4. Enable homework assignment and tracking
5. Provide real-time dashboard statistics

### Secondary Objectives

6. Track student performance and scores
7. Implement a leaderboard system
8. Enable announcements and communication
9. Create a digital timetable
10. Build a concerns/complaints system

---

## 4. Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| PHP | 8.3+ | Server-side language |
| Laravel | 13.x | PHP framework |
| Laravel Sanctum | 4.x | API token authentication |
| SQLite | — | Local development database |
| MySQL | 8.0 | Production database (Docker) |
| Redis | 7.x | Cache, sessions, queue (Docker) |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI library |
| React Router | — | Client-side routing |
| Axios | — | HTTP client |
| Tailwind CSS | 3.4.x | Utility-first CSS framework |
| Vite | — | Build tool & dev server |

### DevOps

| Technology | Purpose |
|---|---|
| Docker | Containerized development environment |
| Nginx | Reverse proxy for Laravel |
| Git | Version control |

---

## 5. System Architecture

### 5.1 High-Level Architecture

```mermaid
graph TB
    subgraph USERS
        U1[Management Admin]
        U2[Teacher]
        U3[Student]
    end

    subgraph FRONTEND["React SPA (Client :5173)"]
        F1[Auth Pages]
        F2[Management Dashboard]
        F3[Teacher Dashboard]
        F4[Student Dashboard]
        F5[Modules: Teachers/Classes/Students/Subjects/Attendance/Homework]
    end

    subgraph BACKEND["Laravel API (Server :8000)"]
        B1[Sanctum Auth Middleware]
        B2[Controllers]
        B3[Eloquent Models]
        B4[API Routes]
    end

    subgraph DATA
        D1[(SQLite<br/>Local Dev)]
        D2[(MySQL 8.0<br/>Docker Prod)]
        D3[(Redis 7.x<br/>Cache/Queue)]
    end

    U1 --> F2
    U2 --> F3
    U3 --> F4

    F1 --> F2
    F1 --> F3
    F1 --> F4
    F5 --> F2
    F3 --> F5
    F4 --> F5

    F2 -->|HTTP/JSON| BACKEND
    F3 -->|HTTP/JSON| BACKEND
    F4 -->|HTTP/JSON| BACKEND

    B1 --> B2
    B2 --> B3
    B3 --> D1
    B3 --> D2
    B2 --> D3
```

### 5.2 Request Flow Diagram (Sequence)

```mermaid
sequenceDiagram
    participant B as Browser
    participant V as Vite Dev Server (:5173)
    participant N as Nginx (:8080)
    participant P as PHP-FPM (:9000)
    participant L as Laravel Router
    participant S as Sanctum Middleware
    participant C as Controller
    participant D as Database

    B->>V: HTTP Request (Login/API Call)
    V->>V: Proxy /api/* target
    V->>N: Forward HTTP Request
    N->>P: FastCGI Pass
    P->>L: Process Request
    L->>S: Check Auth Token
    S-->>L: Authenticated (or 401)
    L->>C: Dispatch to Controller
    C->>D: Eloquent Query (CRUD)
    D-->>C: Result Set
    C-->>L: JSON Response
    L-->>P: Response
    P-->>N: HTTP Response
    N-->>V: Response
    V-->>B: JSON to Axios
    B->>B: Update React UI
```

### 5.3 Docker Architecture

```mermaid
graph LR
    subgraph HOST["Host Machine"]
        MYSQLHOST["MySQL :3307"]
        REDISHOST["Redis :6380"]
        NGINXHOST["Nginx :8080"]
        CLIENTHOST["Client :5174"]
    end

    subgraph DOCKERNET["Docker Network: classease"]
        MYSQL["MySQL 8.0<br/>:3306 (internal)"]
        REDIS["Redis 7<br/>:6379 (internal)"]
        NGINX["Nginx<br/>:80 (internal)"]
        APP["Laravel App<br/>PHP-FPM :9000"]
        QUEUE["Queue Worker<br/>artisan queue:work"]
        CLIENT["React Client<br/>Vite Dev :5173"]
    end

    MYSQLHOST <-->|"3307→3306"| MYSQL
    REDISHOST <-->|"6380→6379"| REDIS
    NGINXHOST <-->|"8080→80"| NGINX
    CLIENTHOST <-->|"5174→5173"| CLIENT

    NGINX <--> APP
    APP <--> MYSQL
    APP <--> REDIS
    APP <--> QUEUE
    CLIENT -->|"proxy → http://nginx"| NGINX
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o| TEACHERS : "user_id (hasOne)"
    USERS ||--o| STUDENTS : "user_id (hasOne)"
    TEACHERS ||--o{ CLASSES : "class_teacher (hasMany)"
    TEACHERS ||--o{ SUBJECTS : "teacherId (hasMany)"
    TEACHERS ||--o{ HOMEWORKS : "assigned_by (hasMany)"
    TEACHERS ||--o{ ATTENDANCES : "marked_by (hasMany)"
    CLASSES ||--o{ STUDENTS : "classId (hasMany)"
    CLASSES ||--o{ SUBJECTS : "classId (hasMany)"
    CLASSES ||--o{ HOMEWORKS : "class_id (hasMany)"
    CLASSES ||--o{ ATTENDANCES : "class_id (hasMany)"
    SUBJECTS ||--o{ HOMEWORKS : "subject_id (hasMany)"
    STUDENTS ||--o{ ATTENDANCES : "student_id (hasMany)"

    USERS {
        int id PK
        string name "Full name"
        string email "Unique"
        string password "Hashed"
        enum role "admin|teacher|student"
        timestamp created_at
        timestamp updated_at
    }

    TEACHERS {
        int id PK
        int user_id FK "References users.id"
        string first_name
        string middle_name
        string surname
        string email "For login"
        string contact
        string designation
        float monthly_salary
        timestamp created_at
        timestamp updated_at
    }

    CLASSES {
        int id PK
        int class_teacher FK "References teachers.id"
        string class_name
        string section
        int room_no
        timestamp created_at
        timestamp updated_at
    }

    STUDENTS {
        int id PK
        int user_id FK "References users.id"
        int classId FK "References classes.id"
        string firstName
        string middleName
        string surname
        string email "For login"
        string password "Hashed"
        string contact
        string parentContact
        string address
        timestamp created_at
        timestamp updated_at
    }

    SUBJECTS {
        int id PK
        int classId FK "References classes.id"
        string subjectName
        int teacherId FK "References teachers.id"
        timestamp created_at
        timestamp updated_at
    }

    HOMEWORKS {
        int id PK
        int class_id FK "References classes.id"
        int subject_id FK "References subjects.id"
        int assigned_by FK "References teachers.id"
        string title
        text description
        date assigned_date
        date due_date
        timestamp created_at
        timestamp updated_at
    }

    ATTENDANCES {
        int id PK
        int student_id FK "References students.id"
        int class_id FK "References classes.id"
        date date "One record per student per day"
        enum status "present|absent|late"
        int marked_by FK "References teachers.id"
        string remarks "Nullable"
        timestamp created_at
        timestamp updated_at
    }
```

### 6.2 Database Tables Summary

| Table | Records | Purpose |
|---|---|---|
| `users` | Admin, teachers, students | Authentication & roles |
| `teachers` | Teacher profiles | Personal info, designation, salary |
| `classes` | Class sections | Class name, section, room, teacher |
| `students` | Student profiles | Personal info, parent contact |
| `subjects` | Subjects per class | Subject name, assigned teacher |
| `attendances` | Daily records | Student presence tracking |
| `homeworks` | Assignments | Title, description, due dates |
| `personal_access_tokens` | Sanctum tokens | API authentication |
| `cache` | Laravel cache | Performance optimization |
| `jobs` | Queue jobs | Background processing |

### 6.3 Migration Timeline

| Date | Migration | Purpose |
|---|---|---|
| 2026-08-01 | `create_users_table` | User authentication |
| 2026-08-01 | `create_cache_table` | Laravel caching |
| 2026-08-01 | `create_jobs_table` | Queue processing |
| 2026-08-04 | `create_teachers_table` | Teacher profiles |
| 2026-08-04 | `create_classes_table` | Class management |
| 2026-08-04 | `create_students_table` | Student profiles |
| 2026-08-15 | `create_personal_access_tokens_table` | Sanctum tokens |
| 2026-08-16 | `create_subjects_table` | Subject management |
| 2026-08-18 | `add_email_to_teachers_table` | Teacher email field |
| 2026-08-18 | `add_email_password_to_students_table` | Student auth fields |
| 2026-09-04 | `create_attendances_table` | Attendance tracking |
| 2026-09-04 | `create_homeworks_table` | Homework management |

---

## 7. Project Structure

```
ClassEase/
├── classEase/                    # Laravel 13 Backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── AttendanceController.php
│   │   │   │   ├── ClassesController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── HomeworkController.php
│   │   │   │   ├── StudentController.php
│   │   │   │   ├── SubjectController.php
│   │   │   │   └── TeacherController.php
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Teacher.php
│   │   │   ├── classes.php
│   │   │   ├── Student.php
│   │   │   ├── Subject.php
│   │   │   ├── Attendance.php
│   │   │   └── Homework.php
│   │   └── Resources/
│   │       └── ClassesResource.php
│   ├── database/
│   │   ├── migrations/          # 12 migration files
│   │   ├── seeders/
│   │   │   ├── DatabaseSeeder.php
│   │   │   └── ClassEaseTestDataSeeder.php
│   │   └── factories/
│   │       └── UserFactory.php
│   ├── routes/
│   │   ├── api.php              # All API routes
│   │   └── web.php              # Minimal web routes
│   └── .env                     # SQLite config (local)
│
├── client/                      # React SPA (Standalone)
│   ├── src/
│   │   ├── api/                 # Axios API layer
│   │   │   ├── axios.ts
│   │   │   ├── attendance.ts
│   │   │   ├── classes.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── homework.ts
│   │   │   ├── students.ts
│   │   │   ├── subjects.ts
│   │   │   └── teachers.ts
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── PlaceholderPage.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── management/      # Management dashboard & modules
│   │   │   ├── teacher/         # Teacher dashboard
│   │   │   └── student/         # Student dashboard
│   │   ├── routes/
│   │   │   ├── AppRouter.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker/                      # Docker configuration
│   ├── client/                  # Client Dockerfile
│   ├── mysql/                   # MySQL init scripts
│   ├── nginx/                   # Nginx config
│   └── php/                     # PHP-FPM Dockerfile
│
├── docker-compose.yml           # Full stack orchestration
├── PROJECT_CONTEXT.md           # Development checkpoint
└── AGENTS.md                    # Agent instructions
```

---

## 8. User Roles & Permissions

### Role Hierarchy

```mermaid
graph TB
    subgraph ADMIN_ACCESS["Management (Admin) — Full Access"]
        A1[Teachers CRUD]
        A2[Classes CRUD]
        A3[Students CRUD]
        A4[Subjects CRUD]
        A5[Mark & View Attendance]
        A6[Homework CRUD]
        A7[Dashboard Stats]
        A1 --- A2 --- A3 --- A4 --- A5 --- A6 --- A7
    end

    subgraph TEACHER_ACCESS["Teacher — Limited Access"]
        T1[View Own Profile]
        T2[View Assigned Subjects]
        T3[View Homework]
        T1 --- T2 --- T3
    end

    subgraph STUDENT_ACCESS["Student — Read-Only"]
        S1[View Own Profile]
        S2[View Own Class]
        S3[View Own Subjects]
        S4[View Own Attendance]
        S5[View Homework]
        S1 --- S2 --- S3 --- S4 --- S5
    end

    ADMIN_ACCESS --> TEACHER_ACCESS --> STUDENT_ACCESS
```

### Permission Matrix

| Feature | Management | Teacher | Student |
|---|:---:|:---:|:---:|
| Dashboard Stats | Yes | No | No |
| Teacher CRUD | Yes | No | No |
| Class CRUD | Yes | No | No |
| Student CRUD | Yes | No | No |
| Subject CRUD | Yes | No | No |
| Mark Attendance | Yes | No | No |
| View Attendance | Yes | Own class | Own |
| Assign Homework | Yes | No | No |
| View Homework | Yes | Yes | Own class |
| View Own Profile | Yes | Yes | Yes |

---

## 9. Features Implemented

### Module 1: Authentication
- User registration with role selection
- Login with email/password
- Sanctum token-based authentication
- Logout functionality
- Protected routes with role guards

### Module 2: Teacher Management
- List all teachers
- Add new teacher
- Edit teacher details
- Delete teacher
- View teacher subjects

### Module 3: Class Management
- List all classes with teacher info
- Add new class
- Edit class details
- Delete class

### Module 4: Student Management
- Browse students by class
- Add new student
- Edit student details
- Delete student
- View student subjects

### Module 5: Subject Management
- List all subjects
- Add new subject
- Edit subject details
- Delete subject
- View subject details

### Module 6: Dashboard
- Management: Stats cards (Teachers, Students, Classes, Subjects)
- Teacher: Profile info + assigned subjects
- Student: Profile info + class + subjects

### Module 7: Attendance
- Mark attendance (bulk per class)
- Select class + date
- Toggle Present/Absent/Late per student
- View attendance by class + date
- Attendance summary (counts)
- Unique constraint: one record per student per day

### Module 8: Homework
- Assign homework (class, subject, title, dates)
- List homework by class
- Edit homework
- Delete homework
- Overdue indicator
- Student view (by class)

---

## 10. API Endpoints

### Authentication (Public)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | User login |
| POST | `/api/register` | User registration |

### Authentication (Protected)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/me` | Get current user |
| POST | `/api/logout` | Logout |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

### Teachers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teachers` | List all teachers |
| GET | `/api/teachers/{id}` | Get teacher details |
| POST | `/api/teachers` | Create teacher |
| PUT | `/api/teachers/{id}` | Update teacher |
| DELETE | `/api/teachers/{id}` | Delete teacher |
| GET | `/api/teacher/{id}/subjects` | Get teacher's subjects |

### Classes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/classes` | List all classes |
| GET | `/api/classes/{id}` | Get class details |
| POST | `/api/classes` | Create class |
| PUT | `/api/classes/{id}` | Update class |
| DELETE | `/api/classes/{id}` | Delete class |

### Students

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/students` | Create student |
| GET | `/api/student/{id}` | Get student details |
| PUT | `/api/student/{id}` | Update student |
| DELETE | `/api/student/{id}` | Delete student |
| GET | `/api/student/class/{id}` | List students by class |
| GET | `/api/student/{id}/subjects` | Get student's subjects |

### Subjects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | List all subjects |
| GET | `/api/subjects/{id}` | Get subject details |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/{id}` | Update subject |
| DELETE | `/api/subjects/{id}` | Delete subject |

### Attendance

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/attendance` | Mark attendance (bulk) |
| GET | `/api/attendance/class` | Get class attendance by date |
| GET | `/api/attendance/student/{id}` | Get student attendance history |
| PUT | `/api/attendance/{id}` | Update attendance record |

### Homework

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/homework` | Create homework |
| GET | `/api/homework/{id}` | Get homework details |
| PUT | `/api/homework/{id}` | Update homework |
| DELETE | `/api/homework/{id}` | Delete homework |
| GET | `/api/homework/class/{classId}` | List homework by class |
| GET | `/api/homework/student/{studentId}` | List homework by student |

---

## 11. Frontend Pages

### Page Structure

```
Authentication
├── Login.tsx
├── Register.tsx
└── Unauthorized.tsx

Management Dashboard
├── Dashboard.tsx              (Stats cards)
├── Teachers/
│   ├── TeacherList.tsx
│   ├── AddTeacher.tsx
│   └── EditTeacher.tsx
├── Classes/
│   ├── ClassList.tsx
│   └── ClassForm.tsx
├── Students/
│   ├── StudentsByClass.tsx
│   ├── AddStudent.tsx
│   └── EditStudent.tsx
├── Subjects/
│   ├── SubjectList.tsx
│   └── SubjectForm.tsx
├── Attendance/
│   ├── MarkAttendance.tsx
│   └── ViewAttendance.tsx
└── Homework/
    ├── HomeworkList.tsx
    ├── AddHomework.tsx
    └── EditHomework.tsx

Teacher Dashboard
└── Dashboard.tsx              (Profile + Subjects)

Student Dashboard
└── Dashboard.tsx              (Profile + Class + Subjects)
```

### Navigation Flow

```mermaid
graph TD
    START([Login Page]) --> AUTH{Auth Context<br/>Check Token}
    AUTH -->|No token| START
    AUTH -->|Valid token| ROLE{User Role}

    ROLE -->|admin| ADASH[Management Dashboard<br/>/management/dashboard]
    ROLE -->|teacher| TDASH[Teacher Dashboard<br/>/teacher/dashboard]
    ROLE -->|student| SDASH[Student Dashboard<br/>/student/dashboard]

    ADASH --> ASTUD[Students<br/>/management/students]
    ADASH --> ATEACH[Teachers<br/>/management/teachers]
    ADASH --> ACLASS[Classes<br/>/management/classes]
    ADASH --> ASUBJ[Subjects<br/>/management/subjects]
    ADASH --> AATT[Attendance<br/>/management/attendance/mark<br/>/management/attendance/view]
    ADASH --> AHW[Homework<br/>/management/homework]

    ASTUD --> ASTUD1[Students by Class]
    ASTUD --> ASTUD2[Add Student]
    ASTUD --> ASTUD3[Edit Student]

    ATEACH --> ATEACH1[Add Teacher]
    ATEACH --> ATEACH2[Edit Teacher]

    ACLASS --> ACLASS1[Add Class]

    ASUBJ --> ASUBJ1[Add Subject]

    AHW --> AHW1[Add Homework]
    AHW --> AHW2[Edit Homework]

    TDASH --> TSUBJ[Assigned Subjects]
    SDASH --> SCONTS[Own Class & Subjects]
```

---

## 12. Daily Progress Log

### Day 1 — August 4, 2026
**Task:** Database & Models Setup
- Created Laravel 13 project
- Set up database migrations for users, teachers, classes, students
- Created Eloquent models with relationships
- Established project structure

### Day 2 — August 15-16, 2026
**Task:** Subject Module
- Created subjects migration and model
- Built SubjectController with CRUD operations
- Added API routes for subjects
- Set up Sanctum authentication

### Day 3 — August 18, 2026
**Task:** Database Enhancements
- Added email field to teachers table
- Added email and password fields to students table
- Updated seeder with test accounts
- Set up Docker environment

### Day 4 — August 19, 2026
**Task:** Full Stack Integration
- Dockerized the entire stack (MySQL, Redis, Nginx, PHP-FPM)
- Built standalone React client with Vite
- Connected frontend to backend via API
- Full-stack smoke test passed

### Day 5 — September 3, 2026
**Task:** Student CRUD + Teacher Edit + Subjects Module
**Backend:**
- Resolved SubjectController merge conflict
- Added updateStudent() and deleteStudent() methods
- Added PUT/DELETE routes for students

**Frontend:**
- Built SubjectList.tsx and SubjectForm.tsx
- Added EditTeacher.tsx
- Added EditStudent.tsx
- Updated AppRouter with new routes
- Updated Sidebar with Subjects link

### Day 6 — September 4, 2026 (Morning)
**Task:** Dashboard Module
**Backend:**
- Created DashboardController with getStats()
- Added GET /dashboard/stats route

**Frontend:**
- Built Management Dashboard with stats cards (4 cards with icons)
- Built Teacher Dashboard with profile + subjects
- Built Student Dashboard with profile + class + subjects
- Added getTeacherSubjects() and getStudentSubjects() API functions
- Fixed pre-existing bugs (TeacherList missing navigate, EditStudent type mismatch)

### Day 6 — September 4, 2026 (Afternoon)
**Task:** Attendance Module
**Backend:**
- Created Attendance model with relationships
- Created AttendanceController (bulk mark, view by class, view by student, update)
- Created attendances migration with unique constraint

**Frontend:**
- Built MarkAttendance.tsx (class selector, date picker, toggle buttons)
- Built ViewAttendance.tsx (status badges, summary counts)
- Added attendance types and API functions
- Added Attendance link to Sidebar

### Day 6 — September 4, 2026 (Evening)
**Task:** Homework Module
**Backend:**
- Created Homework model with relationships
- Created HomeworkController (CRUD + by class + by student)
- Created homeworks migration

**Frontend:**
- Built HomeworkList.tsx (list by class, overdue indicator)
- Built AddHomework.tsx (class → subject filter, date pickers)
- Built EditHomework.tsx
- Added homework types and API functions
- Added Homework link to Sidebar

---

## 13. Future Scope

### Phase 2 (Planned)

| Feature | Description |
|---|---|
| Scores/Performance | Track student marks per subject per exam |
| Leaderboard | Rank students by performance across subjects |
| Announcements | Admin/teacher post announcements to classes |
| Timetable | Digital class schedule (period, subject, time) |
| Concerns | Student/parent raise concerns, admin resolves |

### Phase 3 (Future)

| Feature | Description |
|---|---|
| Parent Portal | Dedicated parent dashboard |
| Fee Management | Track fee payments and dues |
| Exam Management | Create and manage exams |
| Report Cards | Generate and download report cards |
| Notifications | Real-time push notifications |
| Mobile App | React Native mobile application |

---

## Appendix A: Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@classease.com | ClassEase@123 |
| Teacher | teacher1@classease.com | ClassEase@123 |
| Teacher | teacher2@classease.com | ClassEase@123 |
| Teacher | teacher3@classease.com | ClassEase@123 |
| Student | student1@classease.com | ClassEase@123 |
| Student | student2@classease.com | ClassEase@123 |
| Student | student3@classease.com | ClassEase@123 |
| Student | student4@classease.com | ClassEase@123 |
| Student | student5@classease.com | ClassEase@123 |
| Student | student6@classease.com | ClassEase@123 |

---

## Appendix B: Environment Setup

### Local Development

```bash
# Backend (from classEase/)
composer install
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
php artisan serve    # Runs on :8000

# Frontend (from client/)
npm install
npm run dev          # Runs on :5173
```

### Docker Development

```bash
# From repo root
docker compose up -d --build
docker compose exec app php artisan migrate:fresh --seed

# Access:
# Backend: http://localhost:8080
# Frontend: http://localhost:5174
```

---

*This journal is maintained as a living document and updated daily with development progress.*
