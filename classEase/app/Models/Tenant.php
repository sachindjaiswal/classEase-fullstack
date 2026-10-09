<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A tenant is one school / college / institution that shares the app.
 *
 * Tenants are deliberately NOT tenant-scoped themselves — they are the
 * boundary every other model is scoped by, and only the platform admin
 * may manage them.
 */
class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
    ];

    protected $casts = [
        'name' => 'string',
        'slug' => 'string',
    ];

    protected $hidden = [
        'deleted_at',
        'created_at',
        'updated_at',
    ];

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function admins(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'admin');
    }
}
