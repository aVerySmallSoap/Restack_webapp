<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Report extends Model
{
    use HasUuids;

    protected $table = 'reports';
    protected $guarded = [];

    protected $casts = [
        'scan_date' => 'datetime',
    ];

    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class, 'report_id');
    }

    public function techDiscoveries(): HasMany
    {
        return $this->hasMany(TechDiscovery::class, 'report_id');
    }

    public function vulnerabilities(): HasMany
    {
        return $this->hasMany(Vulnerability::class, 'report_id');
    }
}
