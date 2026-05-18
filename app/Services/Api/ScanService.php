<?php

namespace App\Services\Api;

class ScanService
{
    public function __construct(
        private RestackApiClient $api
    ) {}

    public function launchFullScan(string $url, int $userId, ?array $config = null): array
    {
        $response = $this->api->post('/v1/scan', [
            'url'     => $url,
            'user_id' => $userId,
            'config'  => $config,
        ]);
        return $this->api->unwrap($response);
    }

    public function launchQuickScan(string $url, int $userId): array
    {
        $response = $this->api->post('/v1/scan/quick', [
            'url'     => $url,
            'user_id' => $userId,
        ]);
        return $this->api->unwrap($response);
    }

    public function getResult(string $sessionId): array
    {
        $response = $this->api->get("/v1/scan/result/{$sessionId}");
        return $this->api->unwrap($response);
    }

    public function getAllResults(): array
    {
        $response = $this->api->get('/v1/scan/result');
        return $this->api->unwrap($response);
    }

    public function deleteScan(string $sessionId): void
    {
        $response = $this->api->delete("/v1/scan/{$sessionId}");
        $this->api->unwrap($response);
    }
}
