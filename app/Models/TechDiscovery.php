<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TechDiscovery represents a technology fingerprint discovered during the scan.
 *
 * The API defines a TechEntry type containing the name of the technology, the
 * source scanner, an optional version and one or more categories. These fields
 * are stored individually rather than as an opaque JSON blob so they can be
 * queried efficiently.
 */
class TechDiscovery extends Model
{
    use HasUuids;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'tech_discovery';

    /**
     * The name of the database connection to use for this model.
     *
     * TechDiscovery entries originate from the API and are stored in
     * its database.  Specifying the connection here ensures that
     * operations on this model are executed against the API database.
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
        'name',
        'source',
        'version',
        'categories',
        'scan_id',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'categories' => 'array',
        'version'    => 'array',
    ];

    public function scan()
    {
        return $this->belongsTo(Scan::class, 'scan_id');
    }
}
