<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasUuids;


    protected $connection = 'pgsql_api';
    protected $table = 'reports';
    protected $guarded = [];

    protected $casts = [
        'scan_date' => 'datetime',
        'scanner_agreement_rate' => 'float',
        'confidence_rate' => 'float',
    ];

    public function scan(): BelongsTo
    {
        return $this->belongsTo(Scan::class, 'scan_id');
    }
    public function vulnerabilities()
    {
        return $this->hasMany(Vulnerability::class, 'scan_id', 'scan_id');
    }

    public function techDiscoveries()
    {
        return $this->hasMany(TechDiscovery::class, 'scan_id', 'scan_id');
    }
}
