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
      <Text style={styles.label}>방향 선택</Text>
      <View style={styles.row}>
        {DIRECTIONS.map((dir) => {
          const isSelected = selected === dir;
          return (
            <TouchableOpacity
              key={dir}
              style={[styles.button, isSelected && styles.buttonSelected]}
              onPress={() => onSelect(dir as Direction)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{dir === '외선순환' ? '↻' : '↺'}</Text>
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {dir}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#191F28', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8EBED', alignItems: 'center', backgroundColor: '#FFF' },
  buttonSelected: { borderColor: '#3182F6', backgroundColor: '#F0F6FF' },
  emoji: { fontSize: 24, marginBottom: 4 },
  text: { fontSize: 15, color: '#8B95A1', fontWeight: '500' },
  textSelected: { color: '#3182F6', fontWeight: '700' },
});
