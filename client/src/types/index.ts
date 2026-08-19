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
