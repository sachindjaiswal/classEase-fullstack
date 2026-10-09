<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\classes;
use App\Models\Concern;
use App\Models\Homework;
use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Tenant;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ClassEaseTestDataSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Test password
        |--------------------------------------------------------------------------
        |
        | This is ONLY for local development/testing.
        |
        */

        $password = 'ClassEase@123';

        /*
        |--------------------------------------------------------------------------
        | Institution (tenant) that all demo data below belongs to
        |--------------------------------------------------------------------------
        */

        $tenant = Tenant::updateOrCreate(
            ['slug' => 'classease-demo'],
            ['name' => 'ClassEase Demo School']
        );

        /*
        |--------------------------------------------------------------------------
        | Platform super-admin — creates institutions, belongs to none
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            ['email' => 'platform@classease.com'],
            [
                'name' => 'ClassEase Platform',
                'password' => $password,
                'role' => 'platform_admin',
                'tenant_id' => null,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Institution admin
        |--------------------------------------------------------------------------
        */

        $adminUser = User::updateOrCreate(
            ['email' => 'admin@classease.com'],
            [
                'name' => 'ClassEase Admin',
                'password' => $password,
                'role' => 'admin',
                'tenant_id' => $tenant->id,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Teachers
        |--------------------------------------------------------------------------
        */

        $teacherUsers = [];

        $teacherData = [
            [
                'name' => 'Rahul Sharma',
                'email' => 'teacher1@classease.com',
                'first_name' => 'Rahul',
                'middle_name' => 'Kumar',
                'surname' => 'Sharma',
                'contact' => '9000000001',
                'designation' => 'Senior Teacher',
                'monthly_salary' => 45000,
            ],
            [
                'name' => 'Priya Patil',
                'email' => 'teacher2@classease.com',
                'first_name' => 'Priya',
                'middle_name' => 'Raj',
                'surname' => 'Patil',
                'contact' => '9000000002',
                'designation' => 'Teacher',
                'monthly_salary' => 40000,
            ],
            [
                'name' => 'Amit Verma',
                'email' => 'teacher3@classease.com',
                'first_name' => 'Amit',
                'middle_name' => 'Raj',
                'surname' => 'Verma',
                'contact' => '9000000003',
                'designation' => 'Teacher',
                'monthly_salary' => 42000,
            ],
        ];

        foreach ($teacherData as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                    'role' => 'teacher',
                    'tenant_id' => $tenant->id,
                ]
            );

            $teacherUsers[] = Teacher::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'tenant_id' => $tenant->id,
                    'email' => $data['email'],
                    'first_name' => $data['first_name'],
                    'middle_name' => $data['middle_name'],
                    'surname' => $data['surname'],
                    'contact' => $data['contact'],
                    'designation' => $data['designation'],
                    'monthly_salary' => $data['monthly_salary'],
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Classes
        |--------------------------------------------------------------------------
        */

        $class1 = classes::updateOrCreate(
            [
                'class_name' => 'B.Sc Computer Science',
                'section' => 'A',
            ],
            [
                'tenant_id' => $tenant->id,
                'class_teacher' => $teacherUsers[0]->id,
                'room_no' => '101',
            ]
        );

        $class2 = classes::updateOrCreate(
            [
                'class_name' => 'B.Sc Computer Science',
                'section' => 'B',
            ],
            [
                'tenant_id' => $tenant->id,
                'class_teacher' => $teacherUsers[1]->id,
                'room_no' => '102',
            ]
        );

        $class3 = classes::updateOrCreate(
            [
                'class_name' => 'B.Sc Information Technology',
                'section' => 'A',
            ],
            [
                'tenant_id' => $tenant->id,
                'class_teacher' => $teacherUsers[2]->id,
                'room_no' => '103',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Students
        |--------------------------------------------------------------------------
        */

        $studentData = [
            [
                'name' => 'Arjun Mehta',
                'email' => 'student1@classease.com',
                'firstName' => 'Arjun',
                'middleName' => 'Raj',
                'surname' => 'Mehta',
                'contact' => '9100000001',
                'parentContact' => '9200000001',
                'address' => 'Mumbai, Maharashtra',
                'classId' => $class1->id,
            ],
            [
                'name' => 'Sneha Joshi',
                'email' => 'student2@classease.com',
                'firstName' => 'Sneha',
                'middleName' => 'Vijay',
                'surname' => 'Joshi',
                'contact' => '9100000002',
                'parentContact' => '9200000002',
                'address' => 'Mumbai, Maharashtra',
                'classId' => $class1->id,
            ],
            [
                'name' => 'Rohan Kulkarni',
                'email' => 'student3@classease.com',
                'firstName' => 'Rohan',
                'middleName' => 'Sunil',
                'surname' => 'Kulkarni',
                'contact' => '9100000003',
                'parentContact' => '9200000003',
                'address' => 'Thane, Maharashtra',
                'classId' => $class2->id,
            ],
            [
                'name' => 'Ananya Shah',
                'email' => 'student4@classease.com',
                'firstName' => 'Ananya',
                'middleName' => 'Rajesh',
                'surname' => 'Shah',
                'contact' => '9100000004',
                'parentContact' => '9200000004',
                'address' => 'Mumbai, Maharashtra',
                'classId' => $class2->id,
            ],
            [
                'name' => 'Vivek Deshmukh',
                'email' => 'student5@classease.com',
                'firstName' => 'Vivek',
                'middleName' => 'Prakash',
                'surname' => 'Deshmukh',
                'contact' => '9100000005',
                'parentContact' => '9200000005',
                'address' => 'Navi Mumbai, Maharashtra',
                'classId' => $class3->id,
            ],
            [
                'name' => 'Neha Singh',
                'email' => 'student6@classease.com',
                'firstName' => 'Neha',
                'middleName' => 'Amit',
                'surname' => 'Singh',
                'contact' => '9100000006',
                'parentContact' => '9200000006',
                'address' => 'Mumbai, Maharashtra',
                'classId' => $class3->id,
            ],
        ];

        /** @var array<int, list<Student>> $studentsByClass */
        $studentsByClass = [];

        foreach ($studentData as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                    'role' => 'student',
                    'tenant_id' => $tenant->id,
                ]
            );

            $student = Student::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'tenant_id' => $tenant->id,
                    'email' => $data['email'],
                    'password' => $password,
                    'classId' => $data['classId'],
                    'firstName' => $data['firstName'],
                    'middleName' => $data['middleName'],
                    'surname' => $data['surname'],
                    'contact' => $data['contact'],
                    'parentContact' => $data['parentContact'],
                    'address' => $data['address'],
                ]
            );

            $studentsByClass[$data['classId']][] = $student;
        }

        /*
        |--------------------------------------------------------------------------
        | Subjects — four per class, spread across the three teachers
        |--------------------------------------------------------------------------
        */

        $subjectPlan = [
            [$class1, 'Physics', 0],
            [$class1, 'Mathematics', 1],
            [$class1, 'Chemistry', 2],
            [$class1, 'English', 0],
            [$class2, 'Physics', 1],
            [$class2, 'Mathematics', 0],
            [$class2, 'Chemistry', 2],
            [$class2, 'English', 1],
            [$class3, 'Physics', 2],
            [$class3, 'Mathematics', 2],
            [$class3, 'Chemistry', 0],
            [$class3, 'English', 1],
        ];

        /** @var array<int, list<Subject>> $subjectsByClass */
        $subjectsByClass = [];

        foreach ($subjectPlan as [$class, $subjectName, $teacherIndex]) {
            $subject = Subject::updateOrCreate(
                [
                    'classId' => $class->id,
                    'subjectName' => $subjectName,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'teacherId' => $teacherUsers[$teacherIndex]->id,
                ]
            );

            $subjectsByClass[$class->id][] = $subject;
        }

        /*
        |--------------------------------------------------------------------------
        | Scores — every student, every subject of their class, both semesters
        |--------------------------------------------------------------------------
        */

        $semesters = ['Fall 2025', 'current'];
        $examTypes = ['Unit Test', 'Midterm Exam', 'Final Exam'];

        foreach ($studentsByClass as $classId => $classStudents) {
            $classSubjects = $subjectsByClass[$classId];

            foreach ($classStudents as $studentIndex => $student) {
                foreach ($classSubjects as $subjectIndex => $subject) {
                    foreach ($semesters as $semesterIndex => $semester) {
                        foreach ($examTypes as $examIndex => $examType) {
                            $marks = 55 + (($studentIndex * 7) + ($subjectIndex * 5) + ($examIndex * 3) + ($semesterIndex * 4) + $classId) % 41;

                            Score::updateOrCreate(
                                [
                                    'student_id' => $student->id,
                                    'subject_id' => $subject->id,
                                    'exam_type' => $examType,
                                    'semester' => $semester,
                                ],
                                [
                                    'tenant_id' => $tenant->id,
                                    'class_id' => $classId,
                                    'marks_obtained' => $marks,
                                    'total_marks' => 100,
                                ]
                            );
                        }
                    }
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Timetables — a full Monday–Friday grid (five periods) per class
        |--------------------------------------------------------------------------
        */

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $periods = [
            ['1st', '09:00', '09:45'],
            ['2nd', '09:45', '10:30'],
            ['3rd', '10:45', '11:30'],
            ['4th', '11:30', '12:15'],
            ['5th', '13:00', '13:45'],
        ];

        foreach ($subjectsByClass as $classId => $classSubjects) {
            $subjectCount = count($classSubjects);

            foreach ($days as $dayIndex => $day) {
                foreach ($periods as $periodIndex => [$period, $start, $end]) {
                    $subject = $classSubjects[($dayIndex + $periodIndex) % $subjectCount];

                    Timetable::updateOrCreate(
                        [
                            'class_id' => $classId,
                            'day' => $day,
                            'period' => $period,
                        ],
                        [
                            'tenant_id' => $tenant->id,
                            'subject_id' => $subject->id,
                            'teacher_id' => $subject->teacherId,
                            'start_time' => $start,
                            'end_time' => $end,
                        ]
                    );
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Announcements — general notices plus one per class
        |--------------------------------------------------------------------------
        */

        $announcements = [
            [null, 'Welcome to ClassEase', 'The school management system is now live. Browse your timetable, marks and notices from the dashboard.'],
            [null, 'Mid-Term Examination Schedule', 'Mid-term exams begin next Monday. Check the timetable page for the detailed schedule.'],
            [$class1->id, 'Physics Lab Rescheduled', 'This week the Physics lab moves to Friday, 2nd period.'],
            [$class2->id, 'Parent-Teacher Meeting', 'A parent-teacher meeting is scheduled for this Saturday at 10:00 AM.'],
            [$class3->id, 'Annual Sports Day', 'Annual Sports Day registrations are open. Contact your class teacher to sign up.'],
        ];

        foreach ($announcements as [$classId, $title, $description]) {
            Announcement::updateOrCreate(
                ['title' => $title],
                [
                    'tenant_id' => $tenant->id,
                    'class_id' => $classId,
                    'description' => $description,
                    'posted_by' => $adminUser->id,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Concerns — raised by students, one already resolved
        |--------------------------------------------------------------------------
        */

        $concerns = [
            [$studentsByClass[$class1->id][0]->id, 'Mathematics', 'I find the algebra homework difficult. Can we get extra practice problems?', 'open', null],
            [$studentsByClass[$class2->id][0]->id, 'Physics', 'I missed the last Physics lab. Is there a way to catch up?', 'resolved', 'Yes — meet me during the free period on Thursday and we will go through it.'],
        ];

        foreach ($concerns as [$studentId, $subject, $description, $status, $reply]) {
            Concern::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'subject' => $subject,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'description' => $description,
                    'status' => $status,
                    'admin_reply' => $reply,
                    'resolved_by' => $status === 'resolved' ? $adminUser->id : null,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Homework — a few assignments per class
        |--------------------------------------------------------------------------
        */

        $assignedDate = Carbon::now()->subDays(2)->toDateString();
        $dueDate = Carbon::now()->addDays(5)->toDateString();

        $homeworks = [
            [$class1->id, 0, 'Chapter 3 — Numerical Problems', 'Solve problems 1 to 10 from Chapter 3.', 0],
            [$class1->id, 1, 'Algebra Worksheet', 'Complete the algebra worksheet handed out in class.', 1],
            [$class2->id, 2, 'Periodic Table Revision', 'Memorise the first 20 elements and their symbols.', 2],
            [$class2->id, 3, 'Essay Writing', 'Write a 300-word essay on "My Ideal School".', 1],
            [$class3->id, 1, 'Calculus Practice Set', 'Complete the differentiation practice set.', 2],
            [$class3->id, 2, 'Chemical Bonding Notes', 'Prepare short notes on ionic and covalent bonding.', 0],
        ];

        foreach ($homeworks as [$classId, $subjectIndex, $title, $description, $teacherIndex]) {
            $subject = $subjectsByClass[$classId][$subjectIndex];

            Homework::updateOrCreate(
                [
                    'class_id' => $classId,
                    'subject_id' => $subject->id,
                    'title' => $title,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'assigned_by' => $teacherUsers[$teacherIndex]->id,
                    'description' => $description,
                    'assigned_date' => $assignedDate,
                    'due_date' => $dueDate,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Attendance — today and the previous four days for every student
        |--------------------------------------------------------------------------
        */

        $classTeacherIds = [
            $class1->id => $teacherUsers[0]->id,
            $class2->id => $teacherUsers[1]->id,
            $class3->id => $teacherUsers[2]->id,
        ];

        $dates = [];
        for ($offset = 0; $offset < 5; $offset++) {
            $dates[] = Carbon::now()->subDays($offset)->toDateString();
        }

        foreach ($studentsByClass as $classId => $classStudents) {
            foreach ($classStudents as $studentIndex => $student) {
                foreach ($dates as $dayIndex => $date) {
                    $slot = $studentIndex + $dayIndex;
                    $status = 'present';

                    if ($slot % 7 === 4) {
                        $status = 'late';
                    } elseif ($slot % 9 === 6) {
                        $status = 'absent';
                    }

                    Attendance::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'date' => $date,
                        ],
                        [
                            'tenant_id' => $tenant->id,
                            'class_id' => $classId,
                            'status' => $status,
                            'marked_by' => $classTeacherIds[$classId],
                        ]
                    );
                }
            }
        }
    }
}
