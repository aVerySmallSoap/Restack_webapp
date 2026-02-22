<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- ✅ IMPROVED: Read from cookie AND respect localStorage on client side --}}
        <script>
            (function() {
                // ✅ First, check localStorage (client-side source of truth)
                const localStorageAppearance = localStorage.getItem('appearance');

                // ✅ Fallback to server-side cookie value
                const serverAppearance = '{{ $appearance ?? "light" }}';

                // ✅ localStorage takes precedence
                const appearance = localStorageAppearance || serverAppearance;

                // Apply theme immediately to prevent flash
                if (appearance === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                } else {
                    // 'light' mode - ensure dark class is removed
                    document.documentElement.classList.remove('dark');
                }

                // ✅ Sync cookie if localStorage has a value
                if (localStorageAppearance && localStorageAppearance !== serverAppearance) {
                    document.cookie = `appearance=${localStorageAppearance};path=/;max-age=31536000;SameSite=Lax`;
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @routes
        @vite(['resources/js/app.ts', "resources/js/pages/{$page['component']}.vue"])
        @inertiaHead
    </head>

    <body>
        @inertia
    </body>
</html>
