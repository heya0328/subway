import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Direction } from '../types';
import { DIRECTIONS } from '../constants';

interface Props {
  selected: Direction | null;
  onSelect: (direction: Direction) => void;
}

export function DirectionPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>방향</Text>
      <View style={styles.row}>
        {DIRECTIONS.map((dir) => (
          <TouchableOpacity
            key={dir}
            style={[styles.button, selected === dir && styles.buttonSelected]}
            onPress={() => onSelect(dir as Direction)}
          >
            <Text style={[styles.text, selected === dir && styles.textSelected]}>
              {dir}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center' },
  buttonSelected: { borderColor: '#3182F6', backgroundColor: '#E8F0FE' },
  text: { fontSize: 16, color: '#666' },
  textSelected: { color: '#3182F6', fontWeight: '600' },
});
