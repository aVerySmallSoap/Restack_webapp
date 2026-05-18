<?php

namespace App\Providers;

use App\Services\Api\AnalyticsService;
use App\Services\Api\RestackApiClient;
use App\Services\Api\ScanService;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate; // Import the Gate facade
use App\Models\User;
use App\Policies\UserPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(RestackApiClient::class);
        $this->app->singleton(AnalyticsService::class);
        $this->app->singleton(ScanService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Manually register the policy
        Gate::policy(User::class, UserPolicy::class);
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
