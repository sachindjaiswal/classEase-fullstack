<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'class_id',
        'title',
        'description',
        'posted_by',
    ];

    /**
     * @return BelongsTo<classes, $this>
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(classes::class, 'class_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}
