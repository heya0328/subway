import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { DirectionPicker } from '../../src/components/DirectionPicker';
import { StationPicker } from '../../src/components/StationPicker';
import { DepartureList } from '../../src/components/DepartureList';
import { getStationNames } from '../../src/data/stations';
import { supabase } from '../../src/data/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useRealtimeSeats } from '../../src/hooks/useRealtimeSeats';
import { LINE_NAME } from '../../src/constants';
import type { Direction } from '../../src/types';

export const Route = createRoute('/seat/finder', { component: SeatFinderPage });

function SeatFinderPage() {
  const { userId } = useAuth();
  const [direction, setDirection] = useState<Direction | null>(null);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const { departures, isLoading } = useRealtimeSeats(LINE_NAME, direction, currentStation);

  const handleSeatReport = async () => {
    if (!userId || !currentStation) return;
    try {
      await supabase.from('seat_reports').insert({ user_id: userId, line: LINE_NAME, station: currentStation });
      Alert.alert('기록 완료', '자리 확보가 기록되었어요!');
    } catch { /* 실패해도 앱 차단하지 않음 */ }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>빈 자리 확인</Text>
      <Text style={styles.subtitle}>곧 내릴 사람이 있는 역을 확인해보세요</Text>
      <DirectionPicker selected={direction} onSelect={setDirection} />
      {direction && (
        <StationPicker label="현재역" stations={getStationNames()} selected={currentStation} onSelect={setCurrentStation} />
      )}
      {currentStation && (
        <>
          {isLoading ? (
            <Text style={styles.loading}>불러오는 중...</Text>
          ) : (
            <DepartureList departures={departures} currentStation={currentStation} />
          )}
          {departures.length > 0 && (
            <TouchableOpacity style={styles.seatBtn} onPress={handleSeatReport}>
              <Text style={styles.seatBtnText}>앉았어요!</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 24 },
  loading: { fontSize: 14, color: '#8B95A1', textAlign: 'center', marginTop: 20 },
  seatBtn: { backgroundColor: '#00C853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  seatBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
