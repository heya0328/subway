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
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [carNumber, setCarNumber] = useState(userCar);

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
      <Text style={styles.title}>나도 내려요!</Text>

      <Text style={styles.label}>내가 앉은 칸</Text>
      <CarSelector totalCars={10} selectedCar={carNumber} recommendedCar={null} onSelect={setCarNumber} />

      <StationPicker
        label="하차 예정역"
        stations={upcomingStations}
        selected={exitStation}
        onSelect={setExitStation}
      />

      <Text style={styles.label}>약 몇 분 후 하차?</Text>
      <View style={styles.minuteRow}>
        {MINUTE_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.minuteChip, exitMinutes === m && styles.minuteChipSelected]}
            onPress={() => setExitMinutes(m)}
          >
            <Text style={[styles.minuteText, exitMinutes === m && styles.minuteTextSelected]}>
              {m}분
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>메시지 (선택)</Text>
      <TextInput
        style={styles.messageInput}
        placeholder="예: 창가 자리예요"
        placeholderTextColor="#B0B8C1"
        value={message}
        onChangeText={setMessage}
        maxLength={50}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, !exitStation && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!exitStation || isSending}
        >
          <Text style={styles.submitBtnText}>{isSending ? '전송 중...' : '공유하기'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  minuteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  minuteChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  minuteChipSelected: { borderColor: '#FF6B00', backgroundColor: '#FFF3E8' },
  minuteText: { fontSize: 14, color: '#666' },
  minuteTextSelected: { color: '#FF6B00', fontWeight: '600' },
  messageInput: { height: 44, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#191F28', marginBottom: 20 },
  actions: { gap: 10 },
  submitBtn: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#B0B8C1' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#8B95A1' },
});
