<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
class Scan extends Model
{
    use HasUuids;

    protected $table = 'scan'; // Python defined table name as 'scan' (singular)
    protected $guarded = [];

    protected $casts = [
        'scan_date' => 'datetime',
        'data' => 'array',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'report_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }



}
