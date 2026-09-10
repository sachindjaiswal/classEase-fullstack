<?php

namespace Database\Seeders;

use App\Models\classes;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

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
        | Admin
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            ['email' => 'admin@classease.com'],
            [
                'name' => 'ClassEase Admin',
                'password' => $password,
                'role' => 'admin',
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
                ]
            );

            $teacherUsers[] = Teacher::updateOrCreate(
                ['user_id' => $user->id],
                [
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

        foreach ($studentData as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                    'role' => 'student',
                ]
            );

            Student::updateOrCreate(
                ['user_id' => $user->id],
                [
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
        }
    }
}
