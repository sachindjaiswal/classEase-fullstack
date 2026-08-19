<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClassesResource;
use App\Models\classes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassesController extends Controller
{
    // GET classes
    public function getAllClasses(): JsonResponse
    {
        $classes = classes::with('teacher')->get();

        return response()->json([
            'message' => 'Classes retrieved successfully',
            'classes' => ClassesResource::collection($classes),
        ], 200);
        //     return Inertia::render('getClasses', [
        // 'classes' => $classes,

    }

    // GET /classes/{id}
    public function getClass(int $id): JsonResponse
    {
        $class = classes::with('teacher')->find($id);

        if (! $class) {
            return response()->json([
                'message' => 'Class not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Class retrieved successfully',
            'class' => $class,
        ], 200);
    }

    // POST /classes
    public function createClass(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_teacher' => 'nullable|exists:teachers,id',
            'class_name' => 'required|string|max:255',
            'section' => 'required|string|max:255',
            'room_no' => 'required|string|max:255',
        ]);

        $class = classes::create($validated);

        return response()->json([
            'message' => 'Class created successfully',
            'class' => $class,
        ], 201);
    }

    // PUT /classes/{id}
    public function updateClass(Request $request, int $id): JsonResponse
    {
        $class = classes::find($id);

        if (! $class) {
            return response()->json([
                'message' => 'Class not found',
            ], 404);
        }

        $validated = $request->validate([
            'class_teacher' => 'nullable|exists:teachers,id',
            'class_name' => 'sometimes|string|max:255',
            'section' => 'sometimes|string|max:255',
            'room_no' => 'sometimes|string|max:255',
        ]);

        $class->update($validated);

        return response()->json([
            'message' => 'Class updated successfully',
            'class' => $class,
        ], 200);
    }

    // DELETE /classes/{id}
    public function deleteClass(int $id): JsonResponse
    {
        $class = classes::find($id);

        if (! $class) {
            return response()->json([
                'message' => 'Class not found',
            ], 404);
        }

        $class->delete();

        return response()->json([
            'message' => 'Class deleted successfully',
        ], 200);
    }
}
