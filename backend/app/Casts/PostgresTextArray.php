<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * @implements CastsAttributes<list<string>, list<string>>
 */
class PostgresTextArray implements CastsAttributes
{
    /**
     * @param  array<string, mixed>  $attributes
     * @return list<string>
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (is_array($value)) {
            return array_values(array_map('strval', $value));
        }

        if (! is_string($value) || $value === '') {
            return [];
        }

        if ($model->getConnection()->getDriverName() !== 'pgsql') {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? array_values(array_map('strval', $decoded)) : [];
        }

        if ($value === '{}') {
            return [];
        }

        return array_values(array_map(
            static fn (string $item): string => stripcslashes($item),
            str_getcsv(substr($value, 1, -1), ',', '"', '\\'),
        ));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $items = is_array($value) ? array_values(array_map('strval', $value)) : [];

        if ($model->getConnection()->getDriverName() !== 'pgsql') {
            return json_encode($items, JSON_THROW_ON_ERROR);
        }

        if ($items === []) {
            return '{}';
        }

        return '{'.implode(',', array_map(
            static fn (string $item): string => '"'.addcslashes($item, '"\\').'"',
            $items,
        )).'}';
    }
}
