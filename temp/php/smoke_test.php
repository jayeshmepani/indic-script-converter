#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Consumer smoke test for jayeshmepani/lipimala (PHP).
 */

require __DIR__ . '/vendor/autoload.php';

use function Lipimala\toDevanagari;
use function Lipimala\toGujarati;

$iast = 'Kṛṣṇa ā́tman';
$expectedDeva = 'कृष्ण आ॑त्मन्';

$de = toDevanagari($iast);
$gu = toGujarati($iast);

echo "package: jayeshmepani/lipimala\n";
echo "input:   {$iast}\n";
echo "deva:    {$de->rendered}\n";
echo "gujr:    {$gu->rendered}\n";
echo 'restore: ' . $de->restoreOriginal() . "\n";

if ($de->rendered !== $expectedDeva) {
    fwrite(STDERR, "unexpected Devanagari: {$de->rendered}\n");
    exit(1);
}

if ($de->restoreOriginal() !== $iast) {
    fwrite(STDERR, "exact restore failed\n");
    exit(1);
}

echo "OK: PHP consumer smoke test passed\n";
