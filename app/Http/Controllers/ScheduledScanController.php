<?php
// app/Http/Controllers/ScheduledScanController.php

namespace App\Http\Controllers;

use App\Models\ScheduledScan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Models\User;

class ScheduledScanController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = ScheduledScan::with('user');

        // 1. Filter data based on role
        if (!$user->is_admin) {
            $query->where('user_id', $user->id);
        }

        $scans = $query->orderBy('created_at', 'desc')->get();

        // 2. Get Filter Options (Only for Admin)
        $users = [];
        if ($user->is_admin) {
            $users = User::whereHas('scheduledScans')
                ->select('id', 'name')
                ->get()
                ->map(function ($u) {
                    return ['label' => $u->name, 'value' => (string) $u->id];
                });
        }

        return Inertia::render('scan/ScheduledScan', [
            'scans' => $scans,
            'users' => $users,
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'url' => 'required|url',
            'codename' => 'required|string|unique:scheduled_scans,codename',
            'job_type' => 'required|in:interval,cron',
            'configuration' => 'required|array',
        ]);

        ScheduledScan::create([
            'id' => (string) Str::uuid(),
            'user_id' => auth()->id(),
            'url' => $validated['url'],
            'codename' => $validated['codename'],
            'job_type' => $validated['job_type'],
            'configuration' => $validated['configuration'],
        ]);

        return redirect()->back()->with('success', 'Schedule created successfully.');
    }

    public function destroy(string $id)
    {
        $user = auth()->user();

        $scan = ScheduledScan::where('id', $id)->firstOrFail();

        // Security Check: Only allow if Admin OR Owner
        if (!$user->is_admin && $scan->user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $scan->delete();

        return redirect()->back()->with('success', 'Schedule deleted.');
    }

    public function update(Request $request, string $id)
    {
        $scan = ScheduledScan::where('id', $id)->firstOrFail();

        // Security: Ensure User Owns it
        if (!auth()->user()->is_admin && $scan->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'url' => 'required|url',
            'codename' => 'required|string|unique:scheduled_scans,codename,' . $id, // Ignore current ID for unique check
            'job_type' => 'required|in:interval,cron',
            'configuration' => 'required|array',
        ]);

        $scan->update([
            'url' => $validated['url'],
            'codename' => $validated['codename'],
            'job_type' => $validated['job_type'],
            'configuration' => $validated['configuration'],
        ]);

        return redirect()->back()->with('success', 'Schedule updated.');
    }
}
