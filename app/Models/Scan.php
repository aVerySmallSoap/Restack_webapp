<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Scan represents a single scanner run for a report.
 *
 * This model reflects the fields returned by the API's ScannerTaskResult
 * object. Additional attributes such as result, error, runtime_ms etc.
 * capture detailed execution metadata for each scan phase.
 */
class Scan extends Model
{
    use HasUuids;

    /**
     * The table associated with the model.
     *
     * The API uses the singular 'scan' table name rather than the plural
     * convention. Keep this value in sync with the underlying database.
     *
     * @var string
     */
    protected $table = 'scan';

    /**
     * The name of the database connection to use for this model.
     *
     * This tells Laravel to use the API database connection for
     * persisting scanner task results.  Without setting this, the model
     * would use the primary application database which does not contain
     * the API tables.
     *
     * @var string
     */
    protected $connection = 'pgsql_api';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'scanner',
        'phase',
        'status',
        'result',
        'error',
        'runtime_ms',
        'stdout',
        'stderr',
        'artifacts',
        'exit_code',
        'started_at',
        'completed_at',
        'report_id',
        'user_id',
        'data',
        'scan_date',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'scan_date'    => 'datetime',
        'data'         => 'array',
        'result'       => 'array',
        'stdout'       => 'array',
        'stderr'       => 'array',
        'artifacts'    => 'array',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'runtime_ms'   => 'float',
        'error'        => 'string',
        'exit_code'    => 'integer',
    ];

    public function report()
    {
        return $this->hasOne(Report::class, 'scan_id');
    }
    public function techDiscoveries()
    {
        return $this->hasMany(TechDiscovery::class, 'scan_id');
    }
    public function vulnerabilities()
    {
        return $this->hasMany(Vulnerability::class, 'scan_id');
    }
}
