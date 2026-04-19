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

  useEffect(() => {
    const channel = supabase
      .channel('my-claims-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_claims' }, () => { fetchClaims(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_shares' }, () => { fetchClaims(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClaims]);

  if (isLoading) {
    return <View style={styles.center}><Text style={styles.loadingText}>불러오는 중...</Text></View>;
  }

  if (claims.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🎫</Text>
        <Text style={styles.emptyTitle}>신청한 자리가 없어요</Text>
        <Text style={styles.emptyDesc}>홈 탭에서 빈 자리 카드를 눌러{'\n'}자리를 신청해보세요</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>신청 현황</Text>

      {claims.map((claim) => {
        if (!claim.share) return null;
        const share = claim.share;
        const isMatched = claim.status === 'matched';
        const isRejected = claim.status === 'rejected';
        const isPending = claim.status === 'pending';

        let remainingStations = 0;
        try {
          remainingStations = getRemainingStationCount(share.direction as Direction, share.current_station, share.exit_station);
        } catch {}

        return (
          <View key={claim.id} style={[styles.card, isRejected && styles.cardFaded]}>
            <View style={styles.cardTop}>
              <View style={styles.carBadge}>
                <Text style={styles.carBadgeText}>{share.car_number}번 칸</Text>
              </View>
              {isPending && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>⏳ 대기 중</Text>
                </View>
              )}
              {isMatched && (
                <View style={styles.matchedBadge}>
                  <Text style={styles.matchedBadgeText}>🎉 매칭 성공</Text>
                </View>
              )}
              {isRejected && (
                <View style={styles.rejectedBadge}>
                  <Text style={styles.rejectedText}>미매칭</Text>
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>하차역</Text>
              <Text style={styles.infoValue}>{share.exit_station}</Text>
            </View>

            {remainingStations > 0 && !isRejected && (
              <View style={styles.stationsLeft}>
                <View style={styles.stationsBar}>
                  <View style={[styles.stationsBarFill, { width: `${Math.max(10, Math.min(100, 100 - remainingStations * 5))}%` as any }]} />
                </View>
                <Text style={styles.stationsLeftText}>{remainingStations}개 역 남음</Text>
              </View>
            )}

            {isMatched && share.seat_position ? (
              <View style={styles.revealedBox}>
                <Text style={styles.revealedIcon}>🎉</Text>
                <View>
                  <Text style={styles.revealedLabel}>좌석 위치 공개!</Text>
                  <Text style={styles.revealedText}>{share.car_number}번 칸 · {share.seat_position}</Text>
                </View>
              </View>
            ) : isMatched ? (
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, color: '#8B95A1' },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 6 },
  emptyDesc: { fontSize: 15, color: '#8B95A1', textAlign: 'center', lineHeight: 22 },
  title: { fontSize: 22, fontWeight: '800', color: '#191F28', marginBottom: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardFaded: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  carBadge: { backgroundColor: '#191F28', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  carBadgeText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  pendingBadge: { backgroundColor: '#FFF0E5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  pendingText: { fontSize: 13, fontWeight: '600', color: '#FF6B00' },
  matchedBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  matchedBadgeText: { fontSize: 13, fontWeight: '600', color: '#00C853' },
  rejectedBadge: { backgroundColor: '#F2F3F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  rejectedText: { fontSize: 13, color: '#8B95A1' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F4F4F4' },
  infoLabel: { fontSize: 14, color: '#8B95A1' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#191F28' },
  stationsLeft: { marginTop: 12 },
  stationsBar: { height: 6, backgroundColor: '#F2F3F6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  stationsBarFill: { height: '100%', backgroundColor: '#3182F6', borderRadius: 3 },
  stationsLeftText: { fontSize: 13, fontWeight: '600', color: '#3182F6' },
  revealedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', borderRadius: 12, padding: 14, marginTop: 14, gap: 10 },
  revealedIcon: { fontSize: 28 },
  revealedLabel: { fontSize: 14, fontWeight: '700', color: '#00C853' },
  revealedText: { fontSize: 17, fontWeight: '700', color: '#191F28', marginTop: 2 },
  waitingBox: { backgroundColor: '#F8F9FB', borderRadius: 12, padding: 14, marginTop: 14, alignItems: 'center' },
  waitingText: { fontSize: 14, color: '#8B95A1' },
});
