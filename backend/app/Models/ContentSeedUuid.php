<?php

namespace App\Models;

use InvalidArgumentException;
use Ramsey\Uuid\Uuid;

/**
 * Produces deterministic IDs for imported content without changing runtime UUID generation.
 */
final class ContentSeedUuid
{
    private const NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

    /**
     * @var list<string>
     */
    private const ENTITY_TYPES = [
        'content_source',
        'source_record',
        'source_resource',
        'pathway',
        'pathway_skill',
        'career_example',
        'week',
        'lesson',
        'quiz',
        'question',
        'option',
        'project',
        'project_checklist_item',
        'resource',
        'family_template',
        'template_skill',
        'template_career_example',
        'template_week',
        'template_option',
        'template_stage',
        'template_domain_topic',
        'template_domain_topic_alias_source',
        'pathway_generation_topic',
    ];

    public static function root(string $entityType, string $canonicalSourceKey, int $version): string
    {
        self::assertEntityTypeAndVersion($entityType, $version);
        self::assertNonBlankKey($canonicalSourceKey);

        return self::uuidForName(implode('/', [
            'urn:librescence:content:v1',
            $entityType,
            rawurlencode($canonicalSourceKey),
            'v'.$version,
        ]));
    }

    public static function child(
        string $entityType,
        string $parentCanonicalSourceKey,
        string $stableKey,
        int $version,
    ): string {
        self::assertEntityTypeAndVersion($entityType, $version);
        self::assertNonBlankKey($parentCanonicalSourceKey);
        self::assertNonBlankKey($stableKey);

        return self::uuidForName(implode('/', [
            'urn:librescence:content:v1',
            $entityType,
            rawurlencode($parentCanonicalSourceKey),
            rawurlencode($stableKey),
            'v'.$version,
        ]));
    }

    private static function assertEntityTypeAndVersion(string $entityType, int $version): void
    {
        if (! in_array($entityType, self::ENTITY_TYPES, true)) {
            throw new InvalidArgumentException('Unsupported deterministic content entity type.');
        }

        if ($version < 1) {
            throw new InvalidArgumentException('Deterministic content versions must be positive integers.');
        }
    }

    private static function assertNonBlankKey(string $key): void
    {
        if (preg_match('//u', $key) !== 1 || preg_match('/^\s*$/u', $key) === 1) {
            throw new InvalidArgumentException('Deterministic content keys must be non-empty UTF-8 strings.');
        }
    }

    private static function uuidForName(string $name): string
    {
        return Uuid::uuid5(Uuid::fromString(self::NAMESPACE), $name)->toString();
    }
}
