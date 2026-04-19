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
      Alert.alert('좌석 위치를 입력해주세요', '예: 왼쪽 창가, 출입문 옆');
      return;
    }

    try {
      await supabase.from('seat_shares').update({ seat_position: position.trim() }).eq('id', share.id);

      const { data: claims } = await supabase
        .from('seat_claims')
        .select('id, user_id')
        .eq('seat_share_id', share.id)
        .eq('status', 'pending');

      if (!claims || claims.length === 0) {
        Alert.alert('신청자 없음', '아직 신청한 사람이 없어요.');
        return;
      }

      const winner = claims[Math.floor(Math.random() * claims.length)];
      await supabase.from('seat_claims').update({ status: 'matched' }).eq('id', winner.id);
      await supabase.from('seat_shares').update({ matched_user_id: winner.user_id }).eq('id', share.id);
      await supabase.from('seat_claims').update({ status: 'rejected' }).eq('seat_share_id', share.id).neq('id', winner.id).eq('status', 'pending');

      Alert.alert('매칭 완료! 🎉', `${claims.length}명 중 1명에게 자리 정보를 보냈어요.`);
      fetchMyShares();
    } catch {
      Alert.alert('오류', '다시 시도해주세요.');
    }
  };

  if (isLoading) {
    return <View style={styles.center}><Text style={styles.loadingText}>불러오는 중...</Text></View>;
  }

  if (myShares.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>💺</Text>
        <Text style={styles.emptyTitle}>공유한 자리가 없어요</Text>
        <Text style={styles.emptyDesc}>홈 탭에서 "내 자리 공유"를 눌러{'\n'}자리를 공유해보세요</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>내가 공유한 자리</Text>
      <Text style={styles.subtitle}>{myShares.length}개의 자리를 공유하고 있어요</Text>

      {myShares.map((share) => (
        <View key={share.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.carBadge}>
              <Text style={styles.carBadgeText}>{share.car_number}번 칸</Text>
            </View>
            <View style={[styles.claimBadge, share.claim_count > 0 && styles.claimBadgeActive]}>
              <Text style={[styles.claimText, share.claim_count > 0 && styles.claimTextActive]}>
                👋 신청 {share.claim_count}명
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>하차역</Text>
            <Text style={styles.infoValue}>{share.exit_station}</Text>
          </View>

          {share.matched_user_id ? (
            <View style={styles.matchedBanner}>
              <Text style={styles.matchedIcon}>✅</Text>
              <View>
                <Text style={styles.matchedTitle}>매칭 완료</Text>
                <Text style={styles.matchedSeat}>좌석: {share.seat_position || '정보 없음'}</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>좌석 위치</Text>
                <TextInput
                  style={styles.seatInput}
                  placeholder="예: 왼쪽 창가, 출입문 옆"
                  placeholderTextColor="#B0B8C1"
                  value={seatInput[share.id] || ''}
                  onChangeText={(t) => setSeatInput((prev) => ({ ...prev, [share.id]: t }))}
                />
              </View>
              <TouchableOpacity
                style={[styles.getOffBtn, share.claim_count === 0 && styles.getOffBtnDisabled]}
                onPress={() => handleGetOff(share)}
                activeOpacity={0.8}
              >
                <Text style={styles.getOffBtnText}>🚪 다음 정거장에서 내려요</Text>
                {share.claim_count > 0 && (
                  <Text style={styles.getOffSubText}>{share.claim_count}명 중 랜덤 1명에게 자리 정보 전달</Text>
                )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, color: '#8B95A1' },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 6 },
  emptyDesc: { fontSize: 15, color: '#8B95A1', textAlign: 'center', lineHeight: 22 },
  title: { fontSize: 22, fontWeight: '800', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  carBadge: { backgroundColor: '#191F28', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  carBadgeText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  claimBadge: { backgroundColor: '#F2F3F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  claimBadgeActive: { backgroundColor: '#FFF0E5' },
  claimText: { fontSize: 13, fontWeight: '600', color: '#8B95A1' },
  claimTextActive: { color: '#FF6B00' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F4F4F4' },
  infoLabel: { fontSize: 14, color: '#8B95A1' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#191F28' },
  inputSection: { marginTop: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4E5968', marginBottom: 6 },
  seatInput: { height: 48, borderWidth: 1.5, borderColor: '#E8EBED', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#191F28', backgroundColor: '#F8F9FB' },
  getOffBtn: { backgroundColor: '#FF6B00', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  getOffBtnDisabled: { backgroundColor: '#D1D6DB' },
  getOffBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  getOffSubText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  matchedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', borderRadius: 12, padding: 14, marginTop: 14, gap: 10 },
  matchedIcon: { fontSize: 24 },
  matchedTitle: { fontSize: 15, fontWeight: '700', color: '#00C853' },
  matchedSeat: { fontSize: 14, color: '#191F28', marginTop: 2 },
});
