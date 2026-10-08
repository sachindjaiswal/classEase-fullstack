# ClassEase — Diagram Source Code (Mermaid)

Render with mermaid.ink, VS Code 'Markdown Preview Mermaid Support', or Typora.
mermaid.ink URL pattern (browser): prefix a base64 encoded graph with https://mermaid.ink/img/

---

## 1-architecture-high-level

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#1E2A4A','primaryTextColor':'#ffffff','primaryBorderColor':'#B8860B','lineColor':'#33456F','clusterBkg':'#EFF2F7','clusterBorder':'#B8860B','fontFamily':'Segoe UI'}}}%%
graph TB
    subgraph USERS["Users"]
        U1["Management Admin"]
        U2["Teacher"]
        U3["Student"]
    end

    subgraph FRONTEND["React SPA — client/ (local :5173  |  Docker :5174)"]
        F1["Auth - Login / Register (AuthContext)"]
        F2["Management Dashboard + analytics"]
        F3["Teacher Dashboard + analytics"]
        F4["Student Dashboard + analytics"]
        F5["Modules: Teachers, Classes, Students, Subjects, Attendance, Homework, Scores, Leaderboard, Announcements, Timetable, Concerns, Performance"]
    end

    subgraph BACKEND["Laravel 13 API — classEase/ (local :8000  |  Docker nginx :8080)"]
        B1["Sanctum Token Auth + RoleMiddleware"]
        B4["API Routes - 3 role-scoped groups"]
        B2["Controllers (Auth, Classes, Students, Teachers, Subjects, Attendance, Homework, Scores, Leaderboard, Announcements, Timetable, Concerns, Dashboard, Comparison)"]
        B3["Eloquent Models (11 + User)"]
    end

    subgraph DATA["Data Layer"]
        D1[("SQLite - local dev .env")]
        D2[("MySQL 8.0 - Docker :3307")]
        D3[("Redis 7 - cache / sessions / queue :6380")]
    end

    U1 --> F2
    U2 --> F3
    U3 --> F4
    F1 --> F2
    F1 --> F3
    F1 --> F4
    F2 --- F5
    F3 --- F5
    F4 --- F5

    F2 -->|"HTTP / JSON (Bearer token)"| B2
    F3 -->|"HTTP / JSON (Bearer token)"| B2
    F4 -->|"HTTP / JSON (Bearer token)"| B2

    B1 --> B4
    B4 --> B2
    B2 --> B3
    B3 --> D1
    B3 --> D2
    B2 --> D3
```

---

## 2-request-flow-sequence

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
sequenceDiagram
    participant B as Browser
    participant V as Vite Dev Server (:5173 local / :5174 docker)
    participant N as Nginx (:8080, Docker only)
    participant P as PHP-FPM (:9000)
    participant L as Laravel Router
    participant S as Sanctum + Role Middleware
    participant C as Controller
    participant D as Database (SQLite/MySQL) + Redis

    B->>V: HTTP Request (login / API call)
    V->>V: proxy /api/* to target (VITE_API_TARGET)
    V->>N: Forward HTTP Request (Docker) / V->>L: Direct (local)
    N->>P: FastCGI pass
    P->>L: Process request
    L->>S: Verify Bearer token + role
    S-->>L: Authenticated & authorized (or 401 / 403)
    L->>C: Dispatch to controller
    C->>D: Eloquent query (CRUD / aggregates)
    D-->>C: Result set
    C-->>L: JSON response
    L-->>P: Response
    P-->>N: HTTP response (Docker)
    N-->>V: Response (Docker)
    V-->>B: JSON to Axios
    B->>B: Update React UI (state / charts)
```

---

## 3-docker-architecture

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
graph LR
    subgraph HOST["Host Machine (Windows)"]
        MYSQLHOST["MySQL host :3307"]
        REDISHOST["Redis host :6380"]
        NGINXHOST["Nginx host :8080"]
        CLIENTHOST["Client Vite host :5174"]
    end

    subgraph DOCKERNET["Docker network: classease"]
        MYSQL["MySQL 8.0<br/>:3306 (internal)"]
        REDIS["Redis 7<br/>:6379 (internal)"]
        NGINX["Nginx<br/>:80 (internal)<br/>reverse proxy"]
        APP["Laravel app - PHP-FPM :9000<br/>image classease-app<br/>healthcheck kill -0 1"]
        QUEUE["Queue worker<br/>artisan queue:work<br/>image classease-app (no build:)"]
        CLIENT["React client - Vite dev :5173<br/>build: docker/client"]
    end

    MYSQLHOST <-->|"3307 -&gt; 3306"| MYSQL
    REDISHOST <-->|"6380 -&gt; 6379"| REDIS
    NGINXHOST <-->|"8080 -&gt; 80"| NGINX
    CLIENTHOST <-->|"5174 -&gt; 5173"| CLIENT

    NGINX -->|"FastCGI"| APP
    APP <--> MYSQL
    APP <--> REDIS
    APP <--> QUEUE
    CLIENT -->|"proxy /api/* -&gt; http://nginx"| NGINX
```

---

## 4-erd

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
erDiagram
    USERS ||--o| TEACHERS : "user_id (hasOne)"
    USERS ||--o| STUDENTS : "user_id (hasOne)"
    USERS ||--o{ ANNOUNCEMENTS : "posted_by"
    USERS ||--o{ CONCERNS : "resolved_by"
    TEACHERS ||--o{ CLASSES : "class_teacher"
    TEACHERS ||--o{ SUBJECTS : "teacherId"
    TEACHERS ||--o{ ATTENDANCES : "marked_by"
    TEACHERS ||--o{ HOMEWORKS : "assigned_by"
    TEACHERS ||--o{ TIMETABLES : "teacher_id"
    CLASSES ||--o{ STUDENTS : "classId"
    CLASSES ||--o{ SUBJECTS : "classId"
    CLASSES ||--o{ ATTENDANCES : "class_id"
    CLASSES ||--o{ HOMEWORKS : "class_id"
    CLASSES ||--o{ SCORES : "class_id"
    CLASSES ||--o{ ANNOUNCEMENTS : "class_id (nullable)"
    CLASSES ||--o{ TIMETABLES : "class_id"
    SUBJECTS ||--o{ HOMEWORKS : "subject_id"
    SUBJECTS ||--o{ SCORES : "subject_id"
    SUBJECTS ||--o{ TIMETABLES : "subject_id"
    STUDENTS ||--o{ ATTENDANCES : "student_id"
    STUDENTS ||--o{ SCORES : "student_id"
    STUDENTS ||--o{ CONCERNS : "student_id"

    USERS {
        int id PK
        string name
        string email UK
        string password "hashed"
        enum role "admin|teacher|student"
        datetime deleted_at "SoftDeletes"
    }
    TEACHERS {
        int id PK
        int user_id FK
        string first_name
        string middle_name
        string surname
        string email UK
        string contact
        string designation
        int monthly_salary
        datetime deleted_at
    }
    CLASSES {
        int id PK
        int class_teacher FK "nullable -&gt; teachers"
        string class_name
        string section
        int room_no
    }
    STUDENTS {
        int id PK
        int user_id FK "unique"
        int classId FK
        string firstName
        string middleName
        string surname
        string email UK
        string password "hashed"
        string contact
        string parentContact
        string address
        datetime deleted_at
    }
    SUBJECTS {
        int id PK
        int classId FK
        string subjectName
        int teacherId FK
    }
    ATTENDANCES {
        int id PK
        int student_id FK
        int class_id FK
        date date
        enum status "present|absent|late"
        int marked_by FK "nullable"
        string remarks "nullable"
    }
    HOMEWORKS {
        int id PK
        int class_id FK
        int subject_id FK
        int assigned_by FK "nullable"
        string title
        text description "nullable"
        date assigned_date
        date due_date
    }
    SCORES {
        int id PK
        int student_id FK
        int subject_id FK
        int class_id FK
        string exam_type "Unit Test|Midterm|Final"
        string semester "default current"
        int marks_obtained
        int total_marks
    }
    ANNOUNCEMENTS {
        int id PK
        int class_id FK "null = general"
        string title
        text description "nullable"
        int posted_by FK "nullable -&gt; users"
    }
    TIMETABLES {
        int id PK
        int class_id FK
        string day "Monday-Friday"
        string period "1st, 2nd..."
        int subject_id FK "nullable"
        int teacher_id FK "nullable"
        time start_time "nullable"
        time end_time "nullable"
    }
    CONCERNS {
        int id PK
        int student_id FK
        string subject
        text description "nullable"
        enum status "open|in_progress|resolved"
        text admin_reply "nullable"
        int resolved_by FK "nullable -&gt; users"
    }
```

---

## 5-role-hierarchy

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
graph TB
    subgraph ADMIN["Management (Admin) - Full Access"]
        A1["Classes / Teachers / Students / Subjects CRUD"]
        A2["Dashboard stats + analytics"]
        A3["Attendance - mark & view"]
        A4["Homework CRUD"]
        A5["Scores CRUD + Leaderboard"]
        A6["Announcements + Timetable"]
        A7["Concerns - manage"]
        A8["Performance - head-to-head any two students"]
    end

    subgraph TEACHER["Teacher - Limited Access"]
        T1["Own profile (/teacher/me)"]
        T2["Own subjects + classes"]
        T3["Marks (own subjects)"]
        T4["Attendance (own classes)"]
        T5["Homework (own subjects only)"]
        T6["Announcements + Timetable editor"]
        T7["Concerns - view/manage (no delete)"]
        T8["Performance - head-to-head"]
    end

    subgraph STUDENT["Student - Read-Only (+ raise concerns)"]
        S1["Own profile (/student/me)"]
        S2["Own class + subjects + attendance"]
        S3["Own scores + leaderboard"]
        S4["Performance - vs class / rank / focus / progress / head-to-head"]
        S5["Timetable + announcements + homework"]
        S6["Concerns - raise + track own"]
    end

    ADMIN --> TEACHER --> STUDENT
```

---

## 6-navigation-flow

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
graph TD
    START(["Login (/)"]) --> AUTH{"AuthContext<br/>token valid?"}
    AUTH -->|"no token"| START
    AUTH -->|"valid"| ROLE{"User role"}

    ROLE -->|"admin"| ADASH["Management Dashboard<br/>/management/dashboard"]
    ROLE -->|"teacher"| TDASH["Teacher Dashboard<br/>/teacher/dashboard"]
    ROLE -->|"student"| SDASH["Student Dashboard<br/>/student/dashboard"]

    ADASH --> ASTUD["Students by class (add / edit / subjects)<br/>/management/students"]
    ADASH --> ATEACH["Teachers (add / edit / subjects)<br/>/management/teachers"]
    ADASH --> ACLASS["Classes (add / edit)<br/>/management/classes"]
    ADASH --> ASUBJ["Subjects (add / edit)<br/>/management/subjects"]
    ADASH --> AATT["Attendance (mark / view)<br/>/management/attendance"]
    ADASH --> AHW["Homework (list / add / edit)<br/>/management/homework"]
    ADASH --> ASCORE["Scores (list / add / edit)<br/>/management/scores"]
    ADASH --> ALEAD["Leaderboard (class + exam + semester)<br/>/management/leaderboard"]
    ADASH --> AANN["Announcements (list / add / edit)<br/>/management/announcements"]
    ADASH --> ATT["Timetable (grid editor)<br/>/management/timetable"]
    ADASH --> ACON["Concerns (manage)<br/>/management/concerns"]
    ADASH --> APERF["Performance (head-to-head)<br/>/management/performance"]
    ADASH --> AANL["Analytics (6 detail pages)<br/>/management/analytics/*"]

    TDASH --> TMARKS["Marks (own subjects)<br/>/teacher/scores"]
    TDASH --> TATT["Attendance (own classes)<br/>/teacher/attendance"]
    TDASH --> TT["Timetable (editor + my periods)<br/>/teacher/timetable"]
    TDASH --> THW["Homework (own subjects)<br/>/teacher/homework"]
    TDASH --> TANN["Announcements<br/>/teacher/announcements"]
    TDASH --> TCON["Concerns (no delete)<br/>/teacher/concerns"]
    TDASH --> TPERF["Performance (head-to-head)<br/>/teacher/performance"]
    TDASH --> TANL["Analytics (3 detail pages)<br/>/teacher/analytics/*"]

    SDASH --> SPERF["Performance (5 tabs)<br/>/student/performance"]
    SDASH --> ST["Own Timetable<br/>/student/timetable"]
    SDASH --> SCON["Concerns (raise + track)<br/>/student/concerns"]
    SDASH --> SANL["Analytics (5 detail pages)<br/>/student/analytics/*"]
```

---
Done.

---

## Additional project-flow diagrams (blackbook)

### 0-process-flow

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
flowchart TB
    A["Admin logs in (role: admin)"] --> B["Create Teachers, Classes and Students"]
    B --> C["Assign Class Teacher and Subjects per class"]
    C --> D["Teacher marks daily Attendance"]
    C --> E["Teacher assigns Homework"]
    C --> F["Teacher records Scores (student, subject, exam_type, semester)"]
    F --> G["Leaderboard: overall average % ranked per class (60% academics / 20% attendance / 20% homework)"]
    D --> H["Comparative analytics: vs classmates / gaps to top-3 / progress across semesters / head-to-head"]
    E --> H
    G --> H
    H --> I["Feedback engine: rule-based recommendations"]
    I --> J["Student Dashboard + Performance page"]
    J --> K["Student raises a Concern"]
    K --> L["Admin / Teacher resolves Concern (status + reply)"]
```

### 0-comparative-flow

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
flowchart LR
    subgraph SCORES["scores table: (student_id, subject_id, exam_type, semester)"]
        S1["semester = current"]
        S2["semester = previous (latest other by created_at)"]
    end
    S1 --> bySub["bySubject: marks + % + is_you + class avg / min / max"]
    S1 --> gaps["gaps: my % vs top-3 avg and class avg (sorted gap desc)"]
    S1 --> h2h["head-to-head: A % vs B % per subject, leader + wins"]
    S1 --> ldr["leaderboard: overall avg % rank in class"]
    S2 --> prog["progress: current vs previous % + delta + trend"]
    bySub --> UI["Student Performance page"]
    gaps --> UI
    h2h --> UI
    ldr --> UI
    prog --> UI
```

### 0-feedback-engine

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI'}}}%%
flowchart TD
    A["Student composite record"] --> B{"Attendance rate >= 85%?"}
    B -- "No" --> R1["Recommendation 1: attendance gap - revision plan"]
    B -- "Yes" --> C{"Homework completion >= 90%?"}
    C -- "No" --> R2["Recommendation 2: task consistency warning"]
    C -- "Yes" --> D{"Subject gap vs top-3 >= 8%?"}
    D -- "Yes" --> R3["Recommendation 3: key opportunity subject"]
    D -- "No" --> E["No critical weakness detected"]
    R1 --> F["Actionable next steps per matched rule"]
    R2 --> F
    R3 --> F
    F --> G["Shown in 'Where to Focus' view"]
```

