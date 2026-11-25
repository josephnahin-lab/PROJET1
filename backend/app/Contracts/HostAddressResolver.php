<?php

namespace App\Contracts;

interface HostAddressResolver
{
    /**
     * Resolve a hostname to all A and AAAA address records.
     *
     * @return list<string>|null Null when DNS has no usable address records.
     */
    public function resolve(string $hostname): ?array;
}
