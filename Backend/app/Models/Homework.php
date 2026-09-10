<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Homework extends Model
{
    protected $table = 'homeworks';

    protected $fillable = [
        'class_id',
        'subject_id',
        'assigned_by',
        'title',
        'description',
        'assigned_date',
        'due_date',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'due_date' => 'date',
    ];

    /**
     * @return BelongsTo<classes, $this>
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(classes::class, 'class_id');
    }

    /**
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'assigned_by');
    }
}
