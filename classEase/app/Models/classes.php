<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class classes extends Model
{
    //
    protected $fillable = [
        'class_teacher',
        'class_name',
        'section',
        'room_no',
    ];

    protected $casts = [
        'class_name' => 'string',
        'section' => 'string',
        'room_no' => 'string',

    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'class_teacher');
    }

    /**
     * @return HasMany<Subject, $this>
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'classId');
    }
}
