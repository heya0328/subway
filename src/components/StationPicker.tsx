import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  label: string;
  stations: string[];
  selected: string | null;
  onSelect: (station: string) => void;
}

export function StationPicker({ label, stations, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView style={styles.list} nestedScrollEnabled>
        {stations.map((name) => (
          <TouchableOpacity
            key={name}
            style={[styles.item, selected === name && styles.itemSelected]}
            onPress={() => onSelect(name)}
          >
            <Text style={[styles.itemText, selected === name && styles.itemTextSelected]}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  list: { maxHeight: 200, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8 },
  item: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemSelected: { backgroundColor: '#E8F0FE' },
  itemText: { fontSize: 16, color: '#333' },
  itemTextSelected: { color: '#3182F6', fontWeight: '600' },
});
