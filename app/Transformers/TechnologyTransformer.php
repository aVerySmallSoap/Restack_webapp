<?php

namespace App\Transformers;

class TechnologyTransformer
{
    /**
     * Canonical technology shape sent to the frontend.
     *
     * Maps TechnologiesModelDTO (Python) → Technology (TypeScript):
     *   id         UUID   → string
     *   name       str    → string
     *   version    list?  → string[] | null
     *   source     str    → string
     *   categories list?  → string[] | null
     *
     * The raw `blob` field is intentionally dropped — it is internal scanner
     * data and is not part of the frontend contract.
     */
    public static function transform(array $raw): array
    {
        return [
            'id'         => (string) ($raw['id'] ?? ''),
            'name'       => $raw['name']   ?? '',
            'version'    => self::normalizeVersion($raw['version'] ?? null),
            'source'     => $raw['source'] ?? '',
            'categories' => self::normalizeStringList($raw['categories'] ?? null),
        ];
    }

    public static function collection(array $items): array
    {
        return array_values(array_map([self::class, 'transform'], $items));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * The Python model stores version as list[str] | None.
     * Normalise to string[] | null, filtering out any blank entries.
     */
    private static function normalizeVersion(mixed $raw): ?array
    {
        if (is_null($raw)) {
            return null;
        }

        // Already an array (expected path)
        if (is_array($raw)) {
            $filtered = array_values(array_filter(
                array_map('strval', $raw),
                fn (string $v) => $v !== ''
            ));
            return $filtered ?: null;
        }

        // Scalar string — wrap it
        if (is_string($raw) && $raw !== '') {
            return [$raw];
        }

        return null;
    }

    /**
     * Normalise an optional list of strings (used for categories).
     * Returns null rather than an empty array so the frontend can
     * distinguish "no data" from "empty list".
     */
    private static function normalizeStringList(mixed $raw): ?array
    {
        if (is_null($raw)) {
            return null;
        }

        if (is_array($raw)) {
            $filtered = array_values(array_filter(
                array_map('strval', $raw),
                fn (string $v) => $v !== ''
            ));
            return $filtered ?: null;
        }

        return null;
    }
}
