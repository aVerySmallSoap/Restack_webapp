/**
 * Centralized color palette for vulnerability severity levels
 * This is the single source of truth for all chart and UI components
 */

export const SEVERITY_COLORS = {
    critical: '#ef4444',      // Red-500
    high: '#f97316',          // Orange-500
    medium: '#eab308',        // Yellow-500
    low: '#22c55e',           // Green-500
    informational: '#3b82f6', // Blue-500
    total: '#64748b',         // Slate-500
} as const

export type SeverityLevel = keyof typeof SEVERITY_COLORS

/**
 * Get color by severity level (case-insensitive)
 */
export function getSeverityColor(severity: string): string {
    const normalized = severity.toLowerCase() as SeverityLevel
    return SEVERITY_COLORS[normalized] || SEVERITY_COLORS.informational
}

/**
 * Chart configuration objects for common chart libraries
 */
export const SEVERITY_CHART_CONFIG = {
    critical: { label: 'Critical', color: SEVERITY_COLORS.critical },
    high: { label: 'High', color: SEVERITY_COLORS.high },
    medium: { label: 'Medium', color: SEVERITY_COLORS.medium },
    low: { label: 'Low', color: SEVERITY_COLORS.low },
    informational: { label: 'Informational', color: SEVERITY_COLORS.informational },
    total: { label: 'Total', color: SEVERITY_COLORS.total },
} as const
