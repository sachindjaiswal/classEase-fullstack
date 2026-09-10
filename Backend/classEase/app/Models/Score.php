<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property int $subject_id
 * @property int $class_id
 * @property string $exam_type
 * @property string $semester
 * @property int $marks_obtained
 * @property int $total_marks
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Score extends Model
{
    protected $fillable = [
        'student_id',
        'subject_id',
        'class_id',
        'exam_type',
        'semester',
        'marks_obtained',
        'total_marks',
    ];

    protected $casts = [
        'marks_obtained' => 'integer',
        'total_marks' => 'integer',
    ];

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * @return BelongsTo<classes, $this>
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(classes::class, 'class_id');
    }
}
