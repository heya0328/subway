import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeatShare } from '../types';

interface Props {
  share: SeatShare;
  userCar: number;
}

export function SeatShareCard({ share, userCar }: Props) {
  const distance = Math.abs(share.car_number - userCar);
  const directionText = share.car_number > userCar ? '열차 방향' : share.car_number < userCar ? '열차 반대 방향' : '같은 칸';
  const distanceText = distance === 0 ? '같은 칸' : `${directionText} ${distance}칸 이동`;

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🧑</Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.carNum}>{share.car_number}번 칸</Text>
          <View style={styles.distBadge}>
            <Text style={styles.distText}>{distanceText}</Text>
          </View>
        </View>
        <Text style={styles.exitInfo}>{share.exit_station}에서 내려요</Text>
        {share.message ? <Text style={styles.message}>{share.message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  left: { marginRight: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  carNum: { fontSize: 16, fontWeight: '700', color: '#191F28', marginRight: 8 },
  distBadge: { backgroundColor: '#FFF3E8', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  distText: { fontSize: 11, fontWeight: '600', color: '#FF6B00' },
  exitInfo: { fontSize: 14, color: '#4E5968', marginBottom: 2 },
  message: { fontSize: 13, color: '#8B95A1' },
});
