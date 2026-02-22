import { onMounted, ref, watch } from 'vue';
import { router } from '@inertiajs/vue3';

type Appearance = 'light' | 'dark' | 'system';

export function updateTheme(value: Appearance) {
    if (typeof window === 'undefined') {
        return;
    }

    if (value === 'system') {
        const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const systemTheme = mediaQueryList.matches ? 'dark' : 'light';

        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
        document.documentElement.classList.toggle('dark', value === 'dark');
    }
}

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;

    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    // ✅ Always prioritize localStorage over cookie
    const stored = localStorage.getItem('appearance') as Appearance | null;

    // ✅ If found in localStorage, also sync cookie to ensure consistency
    if (stored) {
        setCookie('appearance', stored);
    }

    return stored;
};

const handleSystemThemeChange = () => {
    const currentAppearance = getStoredAppearance();
    // Only update if the user has EXPLICITLY chosen 'system' mode
    if (currentAppearance === 'system') {
        updateTheme('system');
    }
};

// Keep a persistent reference to prevent garbage collection of the listener
let mediaQueryList: MediaQueryList | null = null;
let isInitialized = false;

export function initializeTheme() {
    if (typeof window === 'undefined') {
        return;
    }

    // ✅ Get saved preference - this is the source of truth
    const savedAppearance = getStoredAppearance();

    if (savedAppearance) {
        // User has a saved preference, use it
        updateTheme(savedAppearance);
    } else {
        // No saved preference, default to 'light'
        updateTheme('light');
    }

    // Set up system theme change listener safely (only once)
    if (!isInitialized && !mediaQueryList) {
        mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQueryList.addEventListener('change', handleSystemThemeChange);
        isInitialized = true;
    }
}

// ✅ NEW: Reinitialize theme on every Inertia navigation
export function setupInertiaThemeSync() {
    if (typeof window === 'undefined') {
        return;
    }

    // Listen for Inertia page navigations
    router.on('navigate', () => {
        // Re-apply theme from localStorage after navigation
        const savedAppearance = getStoredAppearance();
        if (savedAppearance) {
            updateTheme(savedAppearance);
        }
    });
}

export function useAppearance() {
    const appearance = ref<Appearance>('light');

    onMounted(() => {
        const savedAppearance = getStoredAppearance();

        if (savedAppearance) {
            appearance.value = savedAppearance;
        }

        // ✅ Ensure theme is applied on mount
        updateTheme(appearance.value);
    });

    function updateAppearance(value: Appearance) {
        appearance.value = value;

        // Store in localStorage for client-side persistence
        localStorage.setItem('appearance', value);

        // Store in cookie for SSR
        setCookie('appearance', value);

        updateTheme(value);

        console.log('✅ Theme updated to:', value); // Debug log
    }

    return {
        appearance,
        updateAppearance,
    };
}
