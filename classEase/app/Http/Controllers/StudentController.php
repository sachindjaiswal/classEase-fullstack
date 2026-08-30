<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    // Add Student 
    public function addStudent(Request $request)
    {
        $validated = $request->validate([
            'classId' => 'required|exists:classes,id',
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => 'required|email|unique:students,email',
            'password' => 'required|min:6',
            'contact' => 'required',
            'parentContact' => 'required',
            'address' => 'required|string'
        ]);

        $validated['password'] = Hash::make($validated['password']);

        Student::create($validated);

        return response()->json([
            'message' => 'Student added successfully'
        ]);
    }

    // get Student 
    public function getStudent($id){

        $student = Student::with('class')->find($id);

        if(!$student){
            return response()->json(['message'=>'Student not found'],404);
        };

        return response()->json($student);
    }


    public function getAllStudentFromClass($id){
        $students = Student::with('class')->where( 'classId', $id )->get();

        if(!$students){
            return response()->json(['message'=>'There are no students in the class'] , 404);
        }

        return response()->json($students);
    }

    public function getStudentSubjects($id)
{
    $student = Student::find($id);

    if (!$student) {
        return response()->json([
            'message' => 'Student not found'
        ], 404);
    }

    $subjects = Subject::where('classId', $student->classId)
        ->with('teacher')
        ->get();

    return response()->json([
        'message' => 'Student subjects retrieved successfully',
        'subjects' => $subjects
    ]);
}

    
}