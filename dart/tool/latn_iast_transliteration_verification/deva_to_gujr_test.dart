// ignore_for_file: avoid_print

import 'dart:convert';

import 'package:lipimala/deva_gujr_converter.dart';
import 'example_deva.dart' as examples;

void main() {
  print('----------------------------------------------------------------');
  print(' DEVANAGARI TO GUJARATI SCRIPT CONVERSION');
  print('----------------------------------------------------------------');

  for (final source in examples.devanagariSmokeSamples) {
    final result = source.toCanonicalGujaratiFromDevanagari();
    print('"$source" -> "$result"');
  }
}
