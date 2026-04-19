import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ArrivalInfo as ArrivalInfoType } from '../types/metro';

interface Props {
  arrivals: ArrivalInfoType[];
  isLoading: boolean;
}

export function ArrivalInfoCard({ arrivals, isLoading }: Props) {
  if (isLoading) return null;
  if (arrivals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>실시간 열차 정보</Text>
      {arrivals.slice(0, 4).map((item, idx) => {
        const seconds = parseInt(item.barvlDt, 10);
        const minutes = Math.ceil(seconds / 60);
        const timeText = seconds <= 0 ? '곧 도착' : `${minutes}분 후`;

        return (
          <View key={idx} style={styles.row}>
            <View style={styles.dirBadge}>
              <Text style={styles.dirText}>
                {item.updnLine === '상행' ? '내선' : '외선'}
              </Text>
            </View>
            <Text style={styles.msg}>{item.arvlMsg2}</Text>
            <Text style={styles.time}>{timeText}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F0F7FF', padding: 16, borderRadius: 12, marginBottom: 16 },
  header: { fontSize: 14, fontWeight: '700', color: '#3182F6', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dirBadge: { backgroundColor: '#3182F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  dirText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  msg: { flex: 1, fontSize: 14, color: '#333' },
  time: { fontSize: 14, fontWeight: '600', color: '#3182F6' },
});
