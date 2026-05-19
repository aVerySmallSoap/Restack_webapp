<?php

namespace App\Services\Api;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RestackApiClient
{
    private string $baseUrl;
    private int $timeout;
    private PendingRequest $client;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.restack_api.url'), '/');
        $this->timeout = config('services.restack_api.timeout', 30);

        $this->client = Http::baseUrl($this->baseUrl)
            ->timeout($this->timeout)
            ->acceptJson()
            ->withHeaders([
                'X-Internal-Key' => config('services.restack_api.internal_key'),
            ]);
    }

    public function get(string $path, array $query = []): Response
    {
        return $this->client->get($path, $query);
    }

    public function put(string $path, array $body = []): Response
    {
        return $this->client->put($path, $body);
    }

    public function post(string $path, array $body = []): Response
    {
        return $this->client->post($path, $body);
    }

    public function delete(string $path): Response
    {
        return $this->client->delete($path);
    }

    /**
     * Unwraps a FastAPI response or throws with a consistent shape.
     * FastAPI returns { status: 'success'|'failed', data: ..., reason: ... }
     */
    public function unwrap(Response $response): array
    {
        if ($response->failed()) {
            Log::error('Restack API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException(
                'API request failed: ' . $response->status()
            );
        }

        $body = $response->json();

        if (($body['status'] ?? null) === 'failed') {
            throw new \RuntimeException($body['reason'] ?? 'Unknown API error');
        }

        return $body['data'] ?? $body;
    }
}
