<?php

namespace App\Http\Resources;

use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $class_name
 * @property-read string $section
 * @property-read string $room_no
 * @property-read Teacher|null $teacher
 */
class ClassesResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {

        return [
            'id' => $this->id,
            'class_name' => $this->class_name,
            'section' => $this->section,
            'room_no' => $this->room_no,

            'class_teacher' => $this->teacher ? [
                'id' => $this->teacher->id,
                'name' => $this->teacher->first_name
                    .' '.$this->teacher->middle_name
                    .' '.$this->teacher->surname,
                'email' => $this->teacher->email,
                'contact' => $this->teacher->contact,
                'designation' => $this->teacher->designation,
            ] : null,
        ];

    }
}
