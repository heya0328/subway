import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StationPicker } from './StationPicker';
import { CarSelector } from './CarSelector';
import { getStationsInDirection } from '../data/stations';
import type { Direction } from '../types';

interface Props {
  direction: Direction;
  currentStation: string;
  userCar: number;
  onSubmit: (exitStation: string, exitMinutes: number, message: string, carNumber: number) => Promise<void>;
  onCancel: () => void;
}

const MINUTE_OPTIONS = [1, 3, 5, 10, 15, 20];

export function ShareForm({ direction, currentStation, userCar, onSubmit, onCancel }: Props) {
  const [exitStation, setExitStation] = useState<string | null>(null);
  const [exitMinutes, setExitMinutes] = useState(5);
  const [carNumber, setCarNumber] = useState(userCar);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const upcomingStations = getStationsInDirection(direction, currentStation);

  const handleSubmit = async () => {
    if (!exitStation) return;
    setIsSending(true);
    try {
      await onSubmit(exitStation, exitMinutes, message, carNumber);
    } catch {
      Alert.alert('전송 실패', '다시 시도해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>내 자리 공유하기</Text>
      <Text style={styles.subtitle}>곧 내릴 자리를 다른 승객에게 알려주세요</Text>

      <Text style={styles.sectionLabel}>내가 앉은 칸</Text>
      <CarSelector totalCars={10} selectedCar={carNumber} recommendedCar={null} onSelect={setCarNumber} />

      <StationPicker
        label="하차 예정역"
        stations={upcomingStations}
        selected={exitStation}
        onSelect={setExitStation}
      />

      <Text style={styles.sectionLabel}>약 몇 분 후 하차하나요?</Text>
      <View style={styles.minuteRow}>
        {MINUTE_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.minuteChip, exitMinutes === m && styles.minuteChipSelected]}
            onPress={() => setExitMinutes(m)}
            activeOpacity={0.7}
          >
            <Text style={[styles.minuteText, exitMinutes === m && styles.minuteTextSelected]}>
              {m}분
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>메시지 (선택)</Text>
      <View style={styles.messageBox}>
        <TextInput
          style={styles.messageInput}
          placeholder="예: 왼쪽 창가 자리예요"
          placeholderTextColor="#B0B8C1"
          value={message}
          onChangeText={setMessage}
          maxLength={50}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, !exitStation && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!exitStation || isSending}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>{isSending ? '공유 중...' : '자리 공유하기'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 12, borderWidth: 1, borderColor: '#F0F0F0', marginHorizontal: -16, marginBottom: -16 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D6DB', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#4E5968', marginBottom: 10 },
  minuteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  minuteChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F2F3F6' },
  minuteChipSelected: { backgroundColor: '#FF6B00' },
  minuteText: { fontSize: 15, fontWeight: '600', color: '#8B95A1' },
  minuteTextSelected: { color: '#FFF' },
  messageBox: { marginBottom: 24 },
  messageInput: { height: 48, borderWidth: 1.5, borderColor: '#E8EBED', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#191F28', backgroundColor: '#F8F9FB' },
  actions: { gap: 10 },
  submitBtn: { backgroundColor: '#3182F6', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#B0B8C1' },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#8B95A1' },
});
