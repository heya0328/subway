import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';

interface Props {
  share: {
    car_number: number;
    exit_station: string;
    exit_minutes: number;
    message: string;
  };
  userCar: number;
  onPress?: () => void;
}

export function SeatShareCard({ share, userCar, onPress }: Props) {
  const distance = Math.abs(share.car_number - userCar);
  const directionText = share.car_number > userCar ? '열차 방향' : share.car_number < userCar ? '열차 반대 방향' : '같은 칸';
  const distanceText = distance === 0 ? '같은 칸' : `${directionText} ${distance}칸 이동`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.carCircle}>
          <Text style={styles.carCircleText}>{share.car_number}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.carLabel}>{share.car_number}번 칸</Text>
            <View style={[styles.distBadge, distance === 0 && styles.distBadgeSame]}>
              <Text style={[styles.distText, distance === 0 && styles.distTextSame]}>{distanceText}</Text>
            </View>
          </View>
          <Text style={styles.exitInfo}>{share.exit_station}에서 내려요</Text>
          {share.message ? <Text style={styles.message}>{share.message}</Text> : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F4F4F4' },
  row: { flexDirection: 'row', alignItems: 'center' },
  carCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F3F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  carCircleText: { fontSize: 17, fontWeight: '700', color: '#191F28' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  carLabel: { fontSize: 16, fontWeight: '600', color: '#191F28', marginRight: 8 },
  distBadge: { backgroundColor: '#FFF0E5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  distBadgeSame: { backgroundColor: '#E8F5E9' },
  distText: { fontSize: 11, fontWeight: '600', color: '#FF6B00' },
  distTextSame: { color: '#00C853' },
  exitInfo: { fontSize: 14, color: '#4E5968' },
  message: { fontSize: 13, color: '#8B95A1', marginTop: 2 },
  chevron: { fontSize: 22, color: '#D1D6DB', marginLeft: 8 },
});
