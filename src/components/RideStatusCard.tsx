import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RideStatus } from '../types';

interface Props {
  status: RideStatus;
  arrivalStation: string;
  remainingStations: number;
  remainingMinutes: number;
}

const STATUS_CONFIG = {
  riding: { label: '탑승 중', color: '#3182F6', bg: '#E8F0FE' },
  arriving_soon: { label: '곧 내려요', color: '#FF6B00', bg: '#FFF3E8' },
  arrived: { label: '도착', color: '#00C853', bg: '#E8F5E9' },
};

export function RideStatusCard({ status, arrivalStation, remainingStations, remainingMinutes }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.card, { backgroundColor: config.bg }]}>
      <View style={styles.statusBadge}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
      <Text style={styles.destination}>{arrivalStation} 하차 예정</Text>
      <Text style={styles.info}>
        {remainingStations}개 역 남음 · 약 {remainingMinutes}분
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 12, marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: '700' },
  destination: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  info: { fontSize: 14, color: '#8B95A1' },
});
