<?php

declare(strict_types=1);

require '/home/shreesoftech/projects/test1/astro_packages/indic-script-converter/php/autoload.php';

use Lipimala\IastPlainEnglishOptions;
use Lipimala\PlainEnglishRomanizationProfile;
use Lipimala\ScriptToIastOptions;
use Lipimala\UnicodeNormalizationForm;
use function Lipimala\toCanonicalIastFromDevanagari;
use function Lipimala\toCanonicalIastFromGujarati;
use function Lipimala\toHunterianFromDevanagari;
use function Lipimala\toHunterianFromGujarati;
use function Lipimala\toPlainEnglishFromDevanagari;
use function Lipimala\toPlainEnglishFromGujarati;
use function Lipimala\toPlainEnglishFromIast;

$deva = ['ꣾ', 'कꣿ', 'ꣽ', 'a꣼b', 'a꣡', 'राम꣸', 'राम꠱', '꠱', '𑬀', '𑬊',
    'क᳐', 'देवः᳣', 'ᳩ', 'ᳺ', 'ᳲ', 'ᳵ', 'ᳶ', 'ऩ', 'ऱ', 'क़', 'ख़',
    'ग़', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऀ', '॓', '॔', 'ॕ', 'कॎ', '॰', 'ॱ',
    "क\u{200D}", "क\u{200C}", 'नटवर', 'सरकार', 'शुं', 'आज'];
$gujr = ['કૺ', 'નૻ', 'કૼ', 'સ૾', 'ઝ૾', 'ઝ૿', 'ક૽', '૰', '૱',
    'નટવર', 'સમાચાર', 'સર્વે', 'શું', 'આજ', 'ક‍'];

foreach ($deva as $s) {
    echo 'D ' . $s . ' ||| ' . toCanonicalIastFromDevanagari($s)
        . ' ||| ' . toPlainEnglishFromDevanagari($s)
        . ' ||| ' . toHunterianFromDevanagari($s) . "\n";
}
foreach ($gujr as $s) {
    echo 'G ' . $s . ' ||| ' . toCanonicalIastFromGujarati($s)
        . ' ||| ' . toPlainEnglishFromGujarati($s)
        . ' ||| ' . toHunterianFromGujarati($s) . "\n";
}
$preserve = new ScriptToIastOptions(inputNormalization: UnicodeNormalizationForm::PRESERVE);
echo 'P क़ ||| ' . toCanonicalIastFromDevanagari('क़', $preserve) . "\n";
$hunterian = new IastPlainEnglishOptions(profile: PlainEnglishRomanizationProfile::HUNTERIAN);
echo 'I Sarasvatī ||| ' . toPlainEnglishFromIast('Sarasvatī', $hunterian) . "\n";
echo 'C સમાચાર ||| ' . toCanonicalIastFromGujarati('સમાચાર') . "\n";
