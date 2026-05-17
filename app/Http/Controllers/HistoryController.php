<?php

namespace App\Http\Controllers;

use App\Services\Api\ScanService;
use App\Transformers\ScanTransformer;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function __construct(private ScanService $scanService) {}

    public function index()
    {
        $scans = $this->scanService->getAllResults();

        $history = collect($scans)
            ->map(fn($scan) => ScanTransformer::transform($scan))
            ->map(fn($scan) => [
                'id'            => $scan['id'],
                'target'        => $scan['target'],
                'scanType'      => $scan['scan_type'],
                'totalFindings' => $scan['report']['total_vulnerabilities'] ?? 0,
                'criticalHigh'  => $scan['report']['critical_count'] ?? 0,
                'date'          => $scan['scan_date'],
                'status'        => 'Completed',
                'isAutomated'   => $scan['is_automated'],
            ])
            ->sortByDesc('date')
            ->values();

        return Inertia::render('History', ['history' => $history]);
    }

    public function show(string $id)
    {
        try {
            $data = $this->scanService->getResult($id);

            if (!$data || !is_array($data)) {
                return Inertia::render('history/Show', [
                    'report' => null,
                    'error'  => 'The scan service returned an invalid or empty dataset.'
                ]);
            }

            $transformed = ScanTransformer::transform($data);

            array_walk_recursive($transformed, function (&$value) {
                if (is_string($value)) {
                    $value = iconv('UTF-8', 'UTF-8//IGNORE', $value);
                } elseif (is_float($value) && (is_infinite($value) || is_nan($value))) {
                    $value = null;
                }
            });

            return Inertia::render('history/Show', [
                'report' => $transformed
            ]);

        } catch (\Exception $e) {
            return Inertia::render('history/Show', [
                'report' => null,
                'error'  => 'Transformer or parsing runtime exception: ' . $e->getMessage()
            ]);
        }
    }

    public function destroy(string $id)
    {
        $this->scanService->deleteScan($id);
        return to_route('history.index');
    }
}
