import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../data/supabase';
import { getRemainingStationCount } from '../data/stations';
import type { Direction, SeatShare } from '../types';

interface Props {
  userId: string;
}

interface ClaimWithShare {
  id: string;
  status: string;
  seat_share_id: string;
  share: SeatShare | null;
}

export function MyClaimsView({ userId }: Props) {
  const [claims, setClaims] = useState<ClaimWithShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: claimData } = await supabase
        .from('seat_claims')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!claimData || claimData.length === 0) {
        setClaims([]);
        setIsLoading(false);
        return;
      }

      const results: ClaimWithShare[] = [];
      for (const claim of claimData) {
        const { data: share } = await supabase
          .from('seat_shares')
          .select('*')
          .eq('id', claim.seat_share_id)
          .single();
        results.push({ ...claim, share });
      }
      setClaims(results);
    } catch {
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  // Subscribe to changes
  useEffect(() => {
    const channel = supabase
      .channel('my-claims-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_claims' }, () => { fetchClaims(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_shares' }, () => { fetchClaims(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClaims]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (claims.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🎫</Text>
        <Text style={styles.emptyTitle}>신청한 자리가 없어요</Text>
        <Text style={styles.emptyDesc}>홈에서 빈 자리 카드를 눌러 신청해보세요</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>신청 현황</Text>

      {claims.map((claim) => {
        if (!claim.share) return null;
        const share = claim.share;
        const isMatched = claim.status === 'matched';
        const isRejected = claim.status === 'rejected';
        const isPending = claim.status === 'pending';

        let remainingStations = 0;
        try {
          remainingStations = getRemainingStationCount(
            share.direction as Direction,
            share.current_station,
            share.exit_station
          );
        } catch {}

        return (
          <View key={claim.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.carNum}>{share.car_number}번 칸</Text>
              {isPending && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>대기 중</Text>
                </View>
              )}
              {isMatched && (
                <View style={styles.matchedBadge}>
                  <Text style={styles.matchedBadgeText}>매칭 성공!</Text>
                </View>
              )}
              {isRejected && (
                <View style={styles.rejectedBadge}>
                  <Text style={styles.rejectedText}>미매칭</Text>
                </View>
              )}
            </View>

            <Text style={styles.exitInfo}>
              {share.exit_station}에서 하차 예정
            </Text>

            {remainingStations > 0 && !isRejected && (
              <View style={styles.stationsLeft}>
                <Text style={styles.stationsLeftText}>
                  🚇 {remainingStations}개 역 남음
                </Text>
              </View>
            )}

            {isMatched && share.seat_position ? (
              <View style={styles.revealedBox}>
                <Text style={styles.revealedLabel}>🎉 좌석 위치 공개!</Text>
                <Text style={styles.revealedText}>{share.car_number}번 칸 · {share.seat_position}</Text>
              </View>
            ) : isMatched && !share.seat_position ? (
              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>좌석 위치 입력 대기 중...</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loadingText: { fontSize: 14, color: '#8B95A1' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: '#8B95A1', textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 16 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  carNum: { fontSize: 18, fontWeight: '700', color: '#191F28' },
  pendingBadge: { backgroundColor: '#FFF3E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText: { fontSize: 13, fontWeight: '600', color: '#FF6B00' },
  matchedBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  matchedBadgeText: { fontSize: 13, fontWeight: '600', color: '#00C853' },
  rejectedBadge: { backgroundColor: '#F7F8FA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  rejectedText: { fontSize: 13, color: '#8B95A1' },
  exitInfo: { fontSize: 14, color: '#4E5968', marginBottom: 8 },
  stationsLeft: { backgroundColor: '#F0F7FF', borderRadius: 8, padding: 10, marginBottom: 8 },
  stationsLeftText: { fontSize: 14, fontWeight: '600', color: '#3182F6' },
  revealedBox: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 12 },
  revealedLabel: { fontSize: 15, fontWeight: '700', color: '#00C853', marginBottom: 4 },
  revealedText: { fontSize: 17, fontWeight: '700', color: '#191F28' },
  waitingBox: { backgroundColor: '#F7F8FA', borderRadius: 8, padding: 12 },
  waitingText: { fontSize: 14, color: '#8B95A1' },
});
