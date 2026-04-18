import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DepartureCount } from '../types';

interface Props {
  departures: DepartureCount[];
  currentStation: string;
}

export function DepartureList({ departures, currentStation }: Props) {
  if (departures.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>아직 공유 중인 사용자가 없어요</Text>
        <Text style={styles.emptyDesc}>먼저 루틴을 등록해보세요!</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{currentStation} 이후 하차 예정</Text>
      {departures.map((item) => (
        <View key={item.arrival_station} style={styles.row}>
          <Text style={styles.station}>{item.arrival_station}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.departing_count}명</Text>
          </View>
        </View>
      ))}
      <Text style={styles.disclaimer}>
        참고 정보이며, 같은 열차임을 보장하지 않습니다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  station: { fontSize: 16, color: '#333' },
  countBadge: { backgroundColor: '#3182F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  disclaimer: { fontSize: 12, color: '#8B95A1', textAlign: 'center', marginTop: 16 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: '#8B95A1' },
});
