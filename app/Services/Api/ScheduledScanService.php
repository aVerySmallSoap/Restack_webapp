<?php

namespace App\Services\Api;

class ScheduledScanService
{
    public function __construct(
        private RestackApiClient $api
    ) {}

    public function getAll(?int $userId = null): array
    {
        $query = $userId ? ['user_id' => $userId] : [];
        $response = $this->api->get('/v1/scheduled', $query);
        return $this->api->unwrap($response);
    }

    public function create(string $url, ?int $userId, string $codename, string $jobType, array $configuration): array
    {
        $response = $this->api->post('/v1/scheduled', [
            'url'           => $url,
            'user_id'       => $userId,
            'codename'      => $codename,
            'job_type'      => $jobType,
            'configuration' => $configuration,
        ]);
        return $this->api->unwrap($response);
    }

    public function update(string $id, string $url, ?int $userId, string $codename, string $jobType, array $configuration): array
    {
        $response = $this->api->put("/v1/scheduled/{$id}", [
            'url'           => $url,
            'user_id'       => $userId,
            'codename'      => $codename,
            'job_type'      => $jobType,
            'configuration' => $configuration,
        ]);
        return $this->api->unwrap($response);
    }

    public function delete(string $id): void
    {
        $response = $this->api->delete("/v1/scheduled/{$id}");
        $this->api->unwrap($response);
    }
}
