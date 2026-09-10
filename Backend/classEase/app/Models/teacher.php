<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'email',
        'first_name',
        'middle_name',
        'surname',
        'contact',
        'designation',
        'monthly_salary',
    ];

    protected $hidden = [
        'user_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'first_name' => 'string',
        'middle_name' => 'string',
        'surname' => 'string',
        'contact' => 'string',
        'designation' => 'string',
        'monthly_salary' => 'integer',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<classes, $this>
     */
    public function classes(): HasMany
    {
        return $this->hasMany(classes::class, 'class_teacher');
    }

    /**
     * @return HasMany<Subject, $this>
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'teacherId');
    }
}
