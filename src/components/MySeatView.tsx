import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { supabase } from '../data/supabase';
import type { SeatShare } from '../types';

interface Props {
  userId: string;
}

interface ShareWithClaims extends SeatShare {
  claim_count: number;
}

export function MySeatView({ userId }: Props) {
  const [myShares, setMyShares] = useState<ShareWithClaims[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seatInput, setSeatInput] = useState<Record<string, string>>({});

  const fetchMyShares = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: shares } = await supabase
        .from('seat_shares')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!shares || shares.length === 0) {
        setMyShares([]);
        setIsLoading(false);
        return;
      }

      const withCounts: ShareWithClaims[] = [];
      for (const share of shares) {
        const { count } = await supabase
          .from('seat_claims')
          .select('*', { count: 'exact', head: true })
          .eq('seat_share_id', share.id)
          .eq('status', 'pending');
        withCounts.push({ ...share, claim_count: count ?? 0 });
      }
      setMyShares(withCounts);
    } catch {
      setMyShares([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMyShares(); }, [fetchMyShares]);

  const handleGetOff = async (share: ShareWithClaims) => {
    const position = seatInput[share.id] || '';
    if (!position.trim()) {
      Alert.alert('좌석 위치 입력', '예: 왼쪽 창가, 오른쪽 문 앞');
      return;
    }

    try {
      // Save seat position
      await supabase
        .from('seat_shares')
        .update({ seat_position: position.trim() })
        .eq('id', share.id);

      // Get all pending claims
      const { data: claims } = await supabase
        .from('seat_claims')
        .select('id, user_id')
        .eq('seat_share_id', share.id)
        .eq('status', 'pending');

      if (!claims || claims.length === 0) {
        Alert.alert('신청자 없음', '아직 신청한 사람이 없어요.');
        return;
      }

      // Random pick
      const winner = claims[Math.floor(Math.random() * claims.length)];

      // Update winner
      await supabase
        .from('seat_claims')
        .update({ status: 'matched' })
        .eq('id', winner.id);

      // Update seat share
      await supabase
        .from('seat_shares')
        .update({ matched_user_id: winner.user_id })
        .eq('id', share.id);

      // Reject others
      await supabase
        .from('seat_claims')
        .update({ status: 'rejected' })
        .eq('seat_share_id', share.id)
        .neq('id', winner.id)
        .eq('status', 'pending');

      Alert.alert('매칭 완료!', `신청자 ${claims.length}명 중 1명에게 자리 정보를 보냈어요.`);
      fetchMyShares();
    } catch {
      Alert.alert('오류', '다시 시도해주세요.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (myShares.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>💺</Text>
        <Text style={styles.emptyTitle}>공유한 자리가 없어요</Text>
        <Text style={styles.emptyDesc}>홈에서 "내 자리 공유"를 눌러 자리를 공유해보세요</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>내가 공유한 자리</Text>

      {myShares.map((share) => (
        <View key={share.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.carNum}>{share.car_number}번 칸</Text>
            <View style={styles.claimCountBadge}>
              <Text style={styles.claimCountText}>신청 {share.claim_count}명</Text>
            </View>
          </View>

          <Text style={styles.exitInfo}>{share.exit_station}에서 하차 예정</Text>

          {share.matched_user_id ? (
            <View style={styles.matchedBanner}>
              <Text style={styles.matchedText}>✅ 매칭 완료</Text>
              {share.seat_position ? (
                <Text style={styles.seatPosText}>좌석: {share.seat_position}</Text>
              ) : null}
            </View>
          ) : (
            <>
              <TextInput
                style={styles.seatInput}
                placeholder="좌석 위치 입력 (예: 왼쪽 창가)"
                placeholderTextColor="#B0B8C1"
                value={seatInput[share.id] || ''}
                onChangeText={(t) => setSeatInput((prev) => ({ ...prev, [share.id]: t }))}
              />
              <TouchableOpacity
                style={[styles.getOffBtn, share.claim_count === 0 && styles.getOffBtnDisabled]}
                onPress={() => handleGetOff(share)}
              >
                <Text style={styles.getOffBtnText}>
                  다음 정거장에서 내려요 🚪
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}
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
  claimCountBadge: { backgroundColor: '#3182F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  claimCountText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  exitInfo: { fontSize: 14, color: '#4E5968', marginBottom: 12 },
  seatInput: { height: 44, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, color: '#191F28', marginBottom: 12 },
  getOffBtn: { backgroundColor: '#FF6B00', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  getOffBtnDisabled: { backgroundColor: '#B0B8C1' },
  getOffBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  matchedBanner: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 12, marginTop: 4 },
  matchedText: { fontSize: 15, fontWeight: '700', color: '#00C853' },
  seatPosText: { fontSize: 14, color: '#191F28', marginTop: 4 },
});
