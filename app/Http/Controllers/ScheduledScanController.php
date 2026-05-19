<?php

namespace App\Http\Controllers;

use App\Services\Api\ScheduledScanService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduledScanController extends Controller
{
    public function __construct(
        private ScheduledScanService $service
    ) {}

    public function index()
    {
        $user   = auth()->user();
        $userId = $user->is_admin ? null : $user->id;
        $scans  = $this->service->getAll($userId);

        return Inertia::render('scan/ScheduledScan', [
            'scans' => $scans,
            'users' => [],   // populate from your users table if needed for admin filter
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'url'           => 'required|url',
            'codename'      => 'required|string',
            'job_type'      => 'required|in:interval,cron',
            'configuration' => 'required|array',
        ]);

        $this->service->create(
            url:           $validated['url'],
            userId:        auth()->id(),
            codename:      $validated['codename'],
            jobType:       $validated['job_type'],
            configuration: $validated['configuration'],
        );

        return redirect()->back()->with('success', 'Schedule created successfully.');
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'url'           => 'required|url',
            'codename'      => 'required|string',
            'job_type'      => 'required|in:interval,cron',
            'configuration' => 'required|array',
        ]);

        $this->service->update(
            id:            $id,
            url:           $validated['url'],
            userId:        auth()->id(),
            codename:      $validated['codename'],
            jobType:       $validated['job_type'],
            configuration: $validated['configuration'],
        );

        return redirect()->back()->with('success', 'Schedule updated.');
    }

    public function destroy(string $id)
    {
        $this->service->delete($id);
        return redirect()->back()->with('success', 'Schedule deleted.');
    }
}
