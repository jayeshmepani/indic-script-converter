import 'package:lipimala/latn_iast_to_deva.dart';

void main() {
  for (final s in ['raṃ̀', 'ràm̐', 'aṃ̀', 'aṃ́', 'ṃ̀', 'ṃ̄', 'aṃ̄']) {
    print(
      '$s => ${s.toDevanagariFromIast()} codes=${s.toDevanagariFromIast().runes.map((r) => r.toRadixString(16)).join(' ')}',
    );
  }
}
