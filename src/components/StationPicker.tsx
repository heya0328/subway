import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  label: string;
  stations: string[];
  selected: string | null;
  onSelect: (station: string) => void;
}

const recentStations: string[] = [];

function addRecent(name: string) {
  const idx = recentStations.indexOf(name);
  if (idx !== -1) recentStations.splice(idx, 1);
  recentStations.unshift(name);
  if (recentStations.length > 3) recentStations.pop();
}

export function StationPicker({ label, stations, selected, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return stations;
    return stations.filter((s) => s.includes(query.trim()));
  }, [stations, query]);

  const recents = recentStations.filter((s) => stations.includes(s));

  const handleSelect = (name: string) => {
    addRecent(name);
    onSelect(name);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder="역 이름 검색"
        placeholderTextColor="#B0B8C1"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      {recents.length > 0 && !query && (
        <View style={styles.recentRow}>
          {recents.map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.recentChip, selected === name && styles.recentChipSelected]}
              onPress={() => handleSelect(name)}
            >
              <Text style={[styles.recentText, selected === name && styles.recentTextSelected]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView style={styles.list} nestedScrollEnabled>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>검색 결과가 없어요</Text>
        ) : (
          filtered.map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.item, selected === name && styles.itemSelected]}
              onPress={() => handleSelect(name)}
            >
              <Text style={[styles.itemText, selected === name && styles.itemTextSelected]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { height: 44, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#191F28', marginBottom: 8 },
  recentRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  recentChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F7F8FA' },
  recentChipSelected: { backgroundColor: '#E8F0FE' },
  recentText: { fontSize: 13, color: '#8B95A1' },
  recentTextSelected: { color: '#3182F6', fontWeight: '600' },
  list: { maxHeight: 200, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8 },
  item: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemSelected: { backgroundColor: '#E8F0FE' },
  itemText: { fontSize: 16, color: '#333' },
  itemTextSelected: { color: '#3182F6', fontWeight: '600' },
  emptyText: { padding: 16, textAlign: 'center', color: '#8B95A1', fontSize: 14 },
});
