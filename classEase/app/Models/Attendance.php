<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'student_id',
        'class_id',
        'date',
        'status',
        'marked_by',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return BelongsTo<classes, $this>
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(classes::class, 'class_id');
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function marker(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'marked_by');
    }
}
