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
    setQuery('');
    onSelect(name);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="역 이름을 검색하세요"
          placeholderTextColor="#B0B8C1"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {recents.length > 0 && !query && (
        <View style={styles.recentSection}>
          <Text style={styles.recentLabel}>최근 선택</Text>
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
        </View>
      )}
      <ScrollView style={styles.list} nestedScrollEnabled>
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>검색 결과가 없어요</Text>
          </View>
        ) : (
          filtered.map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.item, selected === name && styles.itemSelected]}
              onPress={() => handleSelect(name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.itemText, selected === name && styles.itemTextSelected]}>
                {name}
              </Text>
              {selected === name && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#191F28', marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1.5, borderColor: '#E8EBED', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FB', marginBottom: 8 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#191F28', padding: 0 },
  clearBtn: { fontSize: 16, color: '#B0B8C1', padding: 4 },
  recentSection: { marginBottom: 8 },
  recentLabel: { fontSize: 12, color: '#8B95A1', marginBottom: 6, fontWeight: '500' },
  recentRow: { flexDirection: 'row', gap: 6 },
  recentChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F2F3F6' },
  recentChipSelected: { backgroundColor: '#E8F0FE' },
  recentText: { fontSize: 14, color: '#4E5968', fontWeight: '500' },
  recentTextSelected: { color: '#3182F6', fontWeight: '600' },
  list: { maxHeight: 220, borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 12, backgroundColor: '#FFF' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FB' },
  itemSelected: { backgroundColor: '#F0F6FF' },
  itemText: { fontSize: 16, color: '#333' },
  itemTextSelected: { color: '#3182F6', fontWeight: '600' },
  checkmark: { fontSize: 16, color: '#3182F6', fontWeight: '700' },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#8B95A1' },
});
