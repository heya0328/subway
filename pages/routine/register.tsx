import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { DirectionPicker } from '../../src/components/DirectionPicker';
import { StationPicker } from '../../src/components/StationPicker';
import { getStationNames, getStationsInDirection } from '../../src/data/stations';
import { useAuth } from '../../src/hooks/useAuth';
import { useRoutine } from '../../src/hooks/useRoutine';
import type { Direction } from '../../src/types';

export const Route = createRoute('/routine/register', {
  component: RegisterPage,
});

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

function RegisterPage() {
  const navigation = Route.useNavigation();
  const { userId } = useAuth();
  const { createRoutine } = useRoutine(userId);

  const [direction, setDirection] = useState<Direction | null>(null);
  const [departure, setDeparture] = useState<string | null>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [isSaving, setIsSaving] = useState(false);

  const allStations = getStationNames();
  const arrivalStations = direction && departure
    ? getStationsInDirection(direction, departure)
    : [];

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  };

  const canSave = direction && departure && arrival && selectedDays.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await createRoutine({
        direction,
        departure_station: departure,
        arrival_station: arrival,
        departure_time: `${hour}:${minute}`,
        days_of_week: selectedDays,
      });
      navigation.navigate('/');
    } catch {
      Alert.alert('저장 실패', '다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>출퇴근 루틴 등록</Text>
      <Text style={styles.subtitle}>한 번 등록하면 매일 원탭으로 탑승을 공유할 수 있어요</Text>

      <DirectionPicker selected={direction} onSelect={(d) => { setDirection(d); setDeparture(null); setArrival(null); }} />

      {direction && (
        <StationPicker
          label="출발역"
          stations={allStations}
          selected={departure}
          onSelect={(s) => { setDeparture(s); setArrival(null); }}
        />
      )}

      {departure && (
        <StationPicker
          label="도착역"
          stations={arrivalStations}
          selected={arrival}
          onSelect={setArrival}
        />
      )}

      <Text style={styles.sectionLabel}>탑승 시간</Text>
      <View style={styles.timeRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {HOURS.map((h) => (
            <TouchableOpacity key={h} style={[styles.timeChip, hour === h && styles.timeChipSelected]} onPress={() => setHour(h)}>
              <Text style={[styles.timeText, hour === h && styles.timeTextSelected]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.timeSep}>:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {MINUTES.map((m) => (
            <TouchableOpacity key={m} style={[styles.timeChip, minute === m && styles.timeChipSelected]} onPress={() => setMinute(m)}>
              <Text style={[styles.timeText, minute === m && styles.timeTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionLabel}>반복 요일</Text>
      <View style={styles.daysRow}>
        {DAYS.map((day, idx) => (
          <TouchableOpacity key={day} style={[styles.dayChip, selectedDays.includes(idx) && styles.dayChipSelected]} onPress={() => toggleDay(idx)}>
            <Text style={[styles.dayText, selectedDays.includes(idx) && styles.dayTextSelected]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={handleSave} disabled={!canSave || isSaving}>
        <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '루틴 등록하기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timeScroll: { flex: 1 },
  timeSep: { fontSize: 20, fontWeight: '700', marginHorizontal: 8 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', marginRight: 6 },
  timeChipSelected: { borderColor: '#3182F6', backgroundColor: '#E8F0FE' },
  timeText: { fontSize: 16, color: '#666' },
  timeTextSelected: { color: '#3182F6', fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: 32 },
  dayChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  dayChipSelected: { borderColor: '#3182F6', backgroundColor: '#3182F6' },
  dayText: { fontSize: 14, color: '#666' },
  dayTextSelected: { color: '#FFF', fontWeight: '600' },
  saveBtn: { backgroundColor: '#3182F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#B0B8C1' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
