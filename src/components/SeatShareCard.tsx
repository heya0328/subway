import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeatShare } from '../types';

interface Props {
  share: SeatShare;
}

export function SeatShareCard({ share }: Props) {
  const createdAt = new Date(share.created_at);
  const now = new Date();
  const agoMinutes = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60000));
  const agoText = agoMinutes === 0 ? '방금' : `${agoMinutes}분 전`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{share.exit_minutes}분 후 하차</Text>
        </View>
        <Text style={styles.ago}>{agoText}</Text>
      </View>
      <Text style={styles.route}>
        {share.current_station} → {share.exit_station}
      </Text>
      {share.message ? (
        <Text style={styles.message}>{share.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 12, padding: 16, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { backgroundColor: '#FF6B00', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  ago: { fontSize: 12, color: '#8B95A1' },
  route: { fontSize: 16, fontWeight: '600', color: '#191F28', marginBottom: 4 },
  message: { fontSize: 14, color: '#4E5968', marginTop: 4 },
});
