<?php

namespace App\Services;

use App\Contracts\HostAddressResolver;
use Throwable;

class DnsHostAddressResolver implements HostAddressResolver
{
    public function resolve(string $hostname): ?array
    {
        try {
            $records = @dns_get_record($hostname, DNS_A | DNS_AAAA);
        } catch (Throwable) {
            return null;
        }

        if (! is_array($records) || $records === []) {
            return null;
        }

        $addresses = [];

        foreach ($records as $record) {
            if (($record['type'] ?? null) === 'A' && isset($record['ip'])) {
                $addresses[] = $record['ip'];
            } elseif (($record['type'] ?? null) === 'AAAA' && isset($record['ipv6'])) {
                $addresses[] = $record['ipv6'];
            }
        }

        $addresses = array_values(array_unique($addresses));

        return $addresses === [] ? null : $addresses;
    }
}
