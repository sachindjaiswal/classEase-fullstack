export type Role = 'management' | 'teacher' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

// ── Teacher ─────────────────────────────────────────────────────
// Matches App\Models\teacher fillable/casts exactly.
export interface Teacher {
  id: number;
  first_name: string;
  middle_name: string | null;
  surname: string;
  email: string;
  contact: string;
  designation: string;
  monthly_salary: number;
}

export type TeacherInput = Omit<Teacher, 'id'>;

// ── Classes ─────────────────────────────────────────────────────
// Shape as returned by ClassesResource (used by GET /classes list).
// NOTE: GET /classes/{id} (single) currently returns a different,
// unformatted shape (raw model + 'teacher' key instead of
// 'class_teacher'). We deliberately avoid calling that endpoint from
// the frontend for now and read class data from the list instead —
// flagged to the backend team to align the two responses.
export interface ClassTeacherSummary {
  id: number;
  name: string;
  email: string;
  contact: string;
  designation: string;
}

export interface SchoolClass {
  id: number;
  class_name: string;
  section: string;
  room_no: string;
  class_teacher: ClassTeacherSummary | null;
}

// Payload shape for create/update — backend expects the teacher's
// numeric id under 'class_teacher', not a nested object.
export interface ClassInput {
  class_teacher: number | null;
  class_name: string;
  section: string;
  room_no: string;
}

// ── Student ─────────────────────────────────────────────────────
// Matches App\Models\Student fillable. Note: 'classId' and
// 'password' are both hidden on the model, so they never come back
// in a response — only appear in the create payload.
export interface StudentInput {
  classId: number;
  firstName: string;
  middleName: string | null;
  surname: string;
  email: string;
  password: string;
  contact: string;
  parentContact: string;
  address: string;
}

// The nested class info that comes back on a student record via
// ->with('class') — this is the RAW classes model, not the
// ClassesResource shape, so class_teacher here is just a numeric id.
export interface StudentClassSummary {
  id: number;
  class_name: string;
  section: string;
  room_no: string;
  class_teacher: number | null;
}

export interface Student {
  id: number;
  firstName: string;
  middleName: string | null;
  surname: string;
  email: string;
  contact: string;
  parentContact: string;
  address: string;
  class?: StudentClassSummary | null;
}

// ── Subject ────────────────────────────────────────────────
export interface Subject {
  id: number;
  classId: number;
  subjectName: string;
  teacherId: number | null;
}

export type SubjectInput = Omit<Subject, 'id'>;

export interface TeacherSummary {
  id: number;
  first_name: string;
  surname: string;
}

export interface ClassSummary {
  id: number;
  class_name: string;
}

export interface SubjectFull extends Subject {
  class: ClassSummary | null;
  teacher: TeacherSummary | null;
}

// ── Dashboard ──────────────────────────────────────────────
export interface DashboardStats {
  teachers: number;
  students: number;
  classes: number;
  subjects: number;
}

// ── Attendance ──────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceItem {
  student_id: number;
  firstName: string;
  surname: string;
  status: AttendanceStatus | null;
  remarks: string | null;
}

export interface AttendancePayload {
  class_id: number;
  date: string;
  attendances: {
    student_id: number;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  class?: ClassSummary;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
}

// ── Homework ──────────────────────────────────────────────
export interface Homework {
  id: number;
  class_id: number;
  subject_id: number;
  assigned_by: number | null;
  title: string;
  description: string | null;
  assigned_date: string;
  due_date: string;
  class?: ClassSummary;
  subject?: Subject;
  teacher?: TeacherSummary;
}

export type HomeworkInput = Omit<Homework, 'id' | 'class' | 'subject' | 'teacher' | 'assigned_by'> & { assigned_by?: number | null };

// ── Scores ──────────────────────────────────────────────
export interface Score {
  id: number;
  student_id: number;
  subject_id: number;
  class_id: number;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
}

export type ScoreInput = Omit<Score, 'id'>;

// Minimal student shape nested on score responses (backend
// selects only these columns — password/user_id never exposed).
export interface StudentSummary {
  id: number;
  firstName: string;
  middleName: string | null;
  surname: string;
}

export interface ScoreFull extends Score {
  student?: StudentSummary | null;
  subject?: Subject | null;
  class?: ClassSummary | null;
}

// ── Leaderboard ──────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  student: StudentSummary | null;
  exams_count: number;
  marks_obtained: number;
  total_marks: number;
  average_percentage: number;
}

export interface LeaderboardResponse {
  message: string;
  class: ClassSummary | null;
  exam: string | null;
  leaderboard: LeaderboardEntry[];
}

// ── Announcements ────────────────────────────────────────
export interface AnnouncementPoster {
  id: number;
  name: string;
}

export interface Announcement {
  id: number;
  class_id: number | null;
  title: string;
  description: string | null;
  posted_by: number | null;
  created_at: string;
  updated_at: string;
  class?: ClassSummary | null;
  poster?: AnnouncementPoster | null;
}

export interface AnnouncementInput {
  class_id: number | null;
  title: string;
  description: string | null;
}
