<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledScan extends Model
{
    use HasUuids;

    protected $table = 'scheduled_scans';

    protected $fillable = [
        'user_id',
        'url',
        'codename',
        'job_type',
        'configuration',
    ];

    protected $casts = [
        'configuration' => 'array',
    ];
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
