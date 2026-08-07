from __future__ import annotations

import base64
import binascii
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from enum import Enum
import json
from typing import Any
import unicodedata


class UnicodeNormalizationForm(str, Enum):
    PRESERVE = 'preserve'
    NFC = 'nfc'
    NFD = 'nfd'

    # Dart-style aliases
    preserve = PRESERVE
    nfc = NFC
    nfd = NFD


class TransliterationProfile(str, Enum):
    STRICT_IAST = 'strictIast'
    ISO_15919_CORE = 'iso15919Core'
    EXTENDED_INDIC = 'extendedIndic'
    HUNTERIAN = 'hunterian'
    PLAIN_ENGLISH = 'plainEnglish'

    strictIast = STRICT_IAST
    iso15919Core = ISO_15919_CORE
    extendedIndic = EXTENDED_INDIC
    hunterian = HUNTERIAN
    plainEnglish = PLAIN_ENGLISH


class TransliterationIssueSeverity(str, Enum):
    INFO = 'info'
    WARNING = 'warning'
    ERROR = 'error'

    info = INFO
    warning = WARNING
    error = ERROR


@dataclass(frozen=True, slots=True)
class TransliterationIssue:
    code: str
    message: str
    severity: TransliterationIssueSeverity = TransliterationIssueSeverity.WARNING
    source_rune_offset: int | None = None

    @property
    def sourceRuneOffset(self) -> int | None:  # Dart-style alias
        return self.source_rune_offset

    def to_json(self) -> dict[str, Any]:
        return {
            'code': self.code,
            'message': self.message,
            'severity': self.severity.value,
            'sourceRuneOffset': self.source_rune_offset,
        }

    def toJson(self) -> dict[str, Any]:
        return self.to_json()

    @classmethod
    def from_json(cls, value: Mapping[str, Any]) -> TransliterationIssue:
        return cls(
            code=str(value['code']),
            message=str(value['message']),
            severity=TransliterationIssueSeverity(str(value['severity'])),
            source_rune_offset=value.get('sourceRuneOffset'),
        )

    fromJson = from_json


@dataclass(frozen=True, slots=True)
class LosslessTransliterationResult:
    original: str
    normalized_input: str
    rendered: str
    profile: TransliterationProfile
    input_normalization: UnicodeNormalizationForm
    output_normalization: UnicodeNormalizationForm
    rendering_is_injective: bool
    issues: tuple[TransliterationIssue, ...] = field(default_factory=tuple)

    @property
    def normalizedInput(self) -> str:
        return self.normalized_input

    @property
    def inputNormalization(self) -> UnicodeNormalizationForm:
        return self.input_normalization

    @property
    def outputNormalization(self) -> UnicodeNormalizationForm:
        return self.output_normalization

    @property
    def renderingIsInjective(self) -> bool:
        return self.rendering_is_injective

    @property
    def original_code_points(self) -> tuple[int, ...]:
        return tuple(ord(ch) for ch in self.original)

    @property
    def originalCodePoints(self) -> tuple[int, ...]:
        return self.original_code_points

    def restore_original(self) -> str:
        return self.original

    def restoreOriginal(self) -> str:
        return self.restore_original()

    @property
    def exact_source_recovery_available(self) -> bool:
        return True

    @property
    def exactSourceRecoveryAvailable(self) -> bool:
        return True

    @property
    def has_errors(self) -> bool:
        return any(issue.severity is TransliterationIssueSeverity.ERROR for issue in self.issues)

    @property
    def hasErrors(self) -> bool:
        return self.has_errors

    def to_json(self) -> dict[str, Any]:
        return {
            'schema': 'indic-script-converter/1',
            'original': self.original,
            'originalCodePoints': list(self.original_code_points),
            'normalizedInput': self.normalized_input,
            'rendered': self.rendered,
            'profile': self.profile.value,
            'inputNormalization': self.input_normalization.value,
            'outputNormalization': self.output_normalization.value,
            'renderingIsInjective': self.rendering_is_injective,
            'issues': [issue.to_json() for issue in self.issues],
        }

    def toJson(self) -> dict[str, Any]:
        return self.to_json()

    @classmethod
    def from_json(cls, value: Mapping[str, Any]) -> LosslessTransliterationResult:
        if value.get('schema') != 'indic-script-converter/1':
            raise ValueError('Unsupported transliteration envelope.')

        original = str(value['original'])
        encoded = [int(v) for v in value['originalCodePoints']]
        actual = [ord(ch) for ch in original]
        if encoded != actual:
            raise ValueError('Envelope source code-point integrity check failed.')

        return cls(
            original=original,
            normalized_input=str(value['normalizedInput']),
            rendered=str(value['rendered']),
            profile=TransliterationProfile(str(value['profile'])),
            input_normalization=UnicodeNormalizationForm(str(value['inputNormalization'])),
            output_normalization=UnicodeNormalizationForm(str(value['outputNormalization'])),
            rendering_is_injective=bool(value['renderingIsInjective']),
            issues=tuple(TransliterationIssue.from_json(v) for v in value['issues']),
        )

    fromJson = from_json

    def to_json_text(
        self, *, ensure_ascii: bool = False, separators: tuple[str, str] | None = None
    ) -> str:
        kwargs: dict[str, Any] = {'ensure_ascii': ensure_ascii}
        if separators is not None:
            kwargs['separators'] = separators
        return json.dumps(self.to_json(), **kwargs)

    @classmethod
    def from_json_text(cls, text: str) -> LosslessTransliterationResult:
        value = json.loads(text)
        if not isinstance(value, dict):
            raise ValueError('Transliteration envelope must be a JSON object.')
        return cls.from_json(value)


def normalize_unicode(text: str, form: UnicodeNormalizationForm) -> str:
    if form is UnicodeNormalizationForm.PRESERVE:
        return text
    if form is UnicodeNormalizationForm.NFC:
        return unicodedata.normalize('NFC', text)
    if form is UnicodeNormalizationForm.NFD:
        return unicodedata.normalize('NFD', text)
    raise ValueError(f'Unsupported normalization form: {form!r}')


normalizeUnicode = normalize_unicode


def is_unicode_combining_mark(value: int | str) -> bool:
    ch = chr(value) if isinstance(value, int) else value
    if len(ch) != 1:
        return False
    return unicodedata.category(ch) in {'Mn', 'Mc', 'Me'}


isUnicodeCombiningMark = is_unicode_combining_mark


def is_encoded_vedic_mark(value: int | str) -> bool:
    cp = ord(value) if isinstance(value, str) else value
    return cp in {0x0951, 0x0952} or 0x1CD0 <= cp <= 0x1CFF or 0xA8E0 <= cp <= 0xA8FF


isEncodedVedicMark = is_encoded_vedic_mark


@dataclass(frozen=True, slots=True)
class EmbeddedExactSource:
    visible_text: str
    original_source: str

    @property
    def visibleText(self) -> str:
        return self.visible_text

    @property
    def originalSource(self) -> str:
        return self.original_source


_EXACT_SOURCE_START_TAG = 0xE0001
_EXACT_SOURCE_END_TAG = 0xE007F
_EXACT_SOURCE_MAGIC = 'LIT1:'


def _string_to_utf16le(text: str) -> bytes:
    # surrogatepass is required to match Dart's exact UTF-16 code-unit storage.
    return text.encode('utf-16-le', errors='surrogatepass')


def _string_from_utf16le(data: bytes) -> str:
    if len(data) % 2:
        raise ValueError('Invalid UTF-16LE source payload length.')
    return data.decode('utf-16-le', errors='surrogatepass')


def _fnv1a32(data: bytes | bytearray | memoryview | Iterable[int]) -> int:
    h = 0x811C9DC5
    for byte in data:
        h ^= int(byte)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def embed_exact_source_metadata(rendered: str, original_source: str) -> str:
    source_bytes = _string_to_utf16le(original_source)
    encoded = base64.urlsafe_b64encode(source_bytes).decode('ascii').rstrip('=')
    source_checksum = f'{_fnv1a32(source_bytes):08x}'
    rendered_checksum = f'{_fnv1a32(_string_to_utf16le(rendered)):08x}'
    payload = f'{_EXACT_SOURCE_MAGIC}{encoded}:{source_checksum}:{rendered_checksum}'

    tagged = [_EXACT_SOURCE_START_TAG]
    for unit in payload.encode('ascii'):
        if unit < 0x20 or unit > 0x7E:
            raise RuntimeError('Exact-source payload unexpectedly contains non-ASCII.')
        tagged.append(0xE0000 + unit)
    tagged.append(_EXACT_SOURCE_END_TAG)
    return rendered + ''.join(chr(cp) for cp in tagged)


embedExactSourceMetadata = embed_exact_source_metadata


def try_decode_exact_source_metadata(text: str) -> EmbeddedExactSource | None:
    if not text or ord(text[-1]) != _EXACT_SOURCE_END_TAG:
        return None

    start = len(text) - 2
    while start >= 0 and ord(text[start]) != _EXACT_SOURCE_START_TAG:
        start -= 1
    if start < 0:
        return None

    payload_units: list[int] = []
    for ch in text[start + 1 : -1]:
        cp = ord(ch)
        if cp < 0xE0020 or cp > 0xE007E:
            return None
        payload_units.append(cp - 0xE0000)

    try:
        payload = bytes(payload_units).decode('ascii')
    except UnicodeDecodeError:
        return None
    if not payload.startswith(_EXACT_SOURCE_MAGIC):
        return None

    body = payload[len(_EXACT_SOURCE_MAGIC) :]
    rendered_split = body.rfind(':')
    if rendered_split <= 0 or rendered_split == len(body) - 1:
        return None
    source_split = body.rfind(':', 0, rendered_split)
    if source_split <= 0 or source_split == rendered_split - 1:
        return None

    encoded = body[:source_split]
    source_checksum = body[source_split + 1 : rendered_split]
    rendered_checksum = body[rendered_split + 1 :]
    if len(source_checksum) != 8 or len(rendered_checksum) != 8:
        return None
    try:
        int(source_checksum, 16)
        int(rendered_checksum, 16)
    except ValueError:
        return None

    try:
        padded = encoded + '=' * ((4 - len(encoded) % 4) % 4)
        source_bytes = base64.urlsafe_b64decode(padded.encode('ascii'))
        if f'{_fnv1a32(source_bytes):08x}' != source_checksum:
            return None
        source = _string_from_utf16le(source_bytes)
        visible = text[:start]
        if f'{_fnv1a32(_string_to_utf16le(visible)):08x}' != rendered_checksum:
            return None
        return EmbeddedExactSource(visible_text=visible, original_source=source)
    except (ValueError, UnicodeError, binascii.Error):
        return None


tryDecodeExactSourceMetadata = try_decode_exact_source_metadata


def strip_exact_source_metadata(text: str) -> str:
    decoded = try_decode_exact_source_metadata(text)
    return decoded.visible_text if decoded is not None else text


stripExactSourceMetadata = strip_exact_source_metadata


def recover_embedded_exact_source(text: str) -> str | None:
    decoded = try_decode_exact_source_metadata(text)
    return decoded.original_source if decoded is not None else None


recoverEmbeddedExactSource = recover_embedded_exact_source


def has_embedded_exact_source(text: str) -> bool:
    return try_decode_exact_source_metadata(text) is not None


hasEmbeddedExactSource = has_embedded_exact_source


__all__ = [
    'EmbeddedExactSource',
    'LosslessTransliterationResult',
    'TransliterationIssue',
    'TransliterationIssueSeverity',
    'TransliterationProfile',
    'UnicodeNormalizationForm',
    'embedExactSourceMetadata',
    'embed_exact_source_metadata',
    'hasEmbeddedExactSource',
    'has_embedded_exact_source',
    'isEncodedVedicMark',
    'isUnicodeCombiningMark',
    'is_encoded_vedic_mark',
    'is_unicode_combining_mark',
    'normalizeUnicode',
    'normalize_unicode',
    'recoverEmbeddedExactSource',
    'recover_embedded_exact_source',
    'stripExactSourceMetadata',
    'strip_exact_source_metadata',
    'tryDecodeExactSourceMetadata',
    'try_decode_exact_source_metadata',
]
