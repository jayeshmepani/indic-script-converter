// ignore_for_file: avoid_print

import 'dart:convert';

import 'package:lipimala/deva_gujr_converter.dart';
import 'example_gujr.dart' as examples;

void main() {
  print('----------------------------------------------------------------');
  print(' GUJARATI TO DEVANAGARI SCRIPT CONVERSION');
  print('----------------------------------------------------------------');

  for (final source in examples.gujaratiSmokeSamples) {
    final result = source.toCanonicalDevanagariFromGujarati();
    print('"$source" -> "$result"');
  }
}
