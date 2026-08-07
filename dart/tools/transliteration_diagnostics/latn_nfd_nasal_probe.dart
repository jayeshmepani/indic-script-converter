import 'package:unorm_dart/unorm_dart.dart' as unorm;

void main() {
  for (final s in [
    'm̐',
    'ṃ̄',
    'ṁ',
    'ṃ',
    'm\u0310',
    'm\u0307',
    'm\u0323\u0304',
  ]) {
    final nfd = unorm.nfd(s);
    print('$s => NFD ${nfd.runes.map((r) => r.toRadixString(16)).join(' ')}');
  }
}
