<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActiveScan extends Model
{
    // The primary key is 'session_id', not 'id'
    protected $primaryKey = 'session_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'active_scans';

    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'target',
        'step',
        'start_time',
    ];
}
