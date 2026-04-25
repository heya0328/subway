import { createRoute } from '@granite-js/react-native';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useSeatClaim } from '../../src/hooks/useSeatClaim';
import { supabase } from '../../src/data/supabase';
import type { SeatShare } from '../../src/types';

export const Route = createRoute('/seat/detail', {
  component: SeatDetailPage,
  screenOptions: { headerShown: false },
});

function SeatDetailPage() {
  const navigation = Route.useNavigation();
  const params = Route.useParams<{ shareId: string; userCar: string }>();
  const { userId } = useAuth();
  const { claimSeat, getMyClaimStatus, isClaiming } = useSeatClaim();

  const [share, setShare] = useState<SeatShare | null>(null);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const shareId = params?.shareId ?? '';
  const userCar = parseInt(params?.userCar ?? '5', 10);

  useEffect(() => {
    async function load() {
      if (!shareId) return;
      try {
        const { data } = await supabase
          .from('seat_shares')
          .select('*')
          .eq('id', shareId)
          .single();
        setShare(data);

        if (userId && data) {
          const status = await getMyClaimStatus(data.id, userId);
          setMyStatus(status);
        }
      } catch {
        setShare(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [shareId, userId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (!share) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>자리 정보를 찾을 수 없어요</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distance = Math.abs(share.car_number - userCar);
  const directionText = share.car_number > userCar ? '열차 방향' : share.car_number < userCar ? '열차 반대 방향' : '같은 칸';
  const distanceText = distance === 0 ? '같은 칸' : `${directionText} ${distance}칸 이동`;

  const isMyShare = false; // 로컬 테스트: 본인 자리도 신청 가능
  const isMatched = share.matched_user_id !== null;
  const isMatchedToMe = share.matched_user_id === userId;

  const handleClaim = async () => {
    if (!userId) return;
    try {
      const result = await claimSeat(share.id, userId);
      if (result.alreadyClaimed) {
        Alert.alert('이미 신청했어요', '매칭 결과를 기다려주세요.');
        return;
      }
      Alert.alert('신청 완료! 🎉', '자리 주인이 내릴 때 랜덤으로 매칭됩니다.');
      setMyStatus('pending');
    } catch {
      Alert.alert('신청 실패', '다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
    <ScrollView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← 돌아가기</Text>
      </TouchableOpacity>

      {/* Car visual */}
      <View style={styles.carVisual}>
        <View style={styles.carBadge}>
          <Text style={styles.carBadgeText}>{share.car_number}번 칸</Text>
        </View>
        <View style={styles.distChip}>
          <Text style={styles.distChipText}>{distanceText}</Text>
        </View>
      </View>

      {/* Exit info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>하차역</Text>
          <Text style={styles.infoValue}>{share.exit_station}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>예상 하차</Text>
          <Text style={styles.infoValue}>약 {share.exit_minutes}분 후</Text>
        </View>
        {share.message ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>메시지</Text>
            <Text style={styles.infoValue}>{share.message}</Text>
          </View>
        ) : null}
      </View>

      {/* Matched to me: show seat position */}
      {isMatchedToMe && (
        <View style={styles.matchedBox}>
          <Text style={styles.matchedEmoji}>🎉</Text>
          <Text style={styles.matchedTitle}>매칭 성공!</Text>
          {share.seat_position ? (
            <Text style={styles.seatPositionText}>좌석 위치: {share.seat_position}</Text>
          ) : (
            <Text style={styles.seatWaiting}>좌석 정보 입력 대기 중</Text>
          )}
        </View>
      )}

      {/* Claim button */}
      {!isMyShare && !isMatched && myStatus === null && (
        <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} disabled={isClaiming}>
          <Text style={styles.claimBtnText}>{isClaiming ? '신청 중...' : '자리 양도 신청하기'}</Text>
        </TouchableOpacity>
      )}

      {/* Status messages */}
      {myStatus === 'pending' && !isMatched && (
        <View style={styles.statusBox}>
          <Text style={styles.statusEmoji}>⏳</Text>
          <Text style={styles.statusTitle}>매칭 대기 중</Text>
          <Text style={styles.statusDesc}>신청자 중 랜덤으로 매칭됩니다</Text>
        </View>
      )}

      {myStatus === 'rejected' && (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>다른 분에게 매칭됐어요</Text>
          <Text style={styles.statusDesc}>다음 자리를 노려보세요!</Text>
        </View>
      )}

      {!isMyShare && isMatched && !isMatchedToMe && myStatus === null && (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>매칭 완료</Text>
          <Text style={styles.statusDesc}>이미 다른 분에게 매칭된 자리예요</Text>
        </View>
      )}

      {isMyShare && (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>내가 공유한 자리</Text>
          {isMatched ? (
            <Text style={styles.statusDesc}>매칭이 완료됐어요</Text>
          ) : (
            <Text style={styles.statusDesc}>신청자를 기다리고 있어요</Text>
          )}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  backBtn: { paddingVertical: 8, marginBottom: 8 },
  backBtnText: { fontSize: 16, color: '#3182F6', fontWeight: '600' },
  center: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#8B95A1' },
  emptyText: { fontSize: 16, color: '#8B95A1', marginBottom: 12 },
  backLink: { fontSize: 16, color: '#3182F6' },

  // Car visual
  carVisual: { alignItems: 'center', paddingVertical: 32 },
  carBadge: { backgroundColor: '#191F28', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 12 },
  carBadgeText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  distChip: { backgroundColor: '#FFF3E8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  distChipText: { fontSize: 14, fontWeight: '600', color: '#FF6B00' },

  // Info section
  infoSection: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  infoLabel: { fontSize: 14, color: '#8B95A1' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#191F28' },

  // Matched
  matchedBox: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
  matchedEmoji: { fontSize: 40, marginBottom: 8 },
  matchedTitle: { fontSize: 20, fontWeight: '800', color: '#00C853', marginBottom: 8 },
  seatPositionText: { fontSize: 18, fontWeight: '700', color: '#191F28' },
  seatWaiting: { fontSize: 14, color: '#8B95A1' },

  // Claim button
  claimBtn: { backgroundColor: '#3182F6', borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginBottom: 20 },
  claimBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },

  // Status
  statusBox: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
  statusEmoji: { fontSize: 32, marginBottom: 8 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  statusDesc: { fontSize: 14, color: '#8B95A1' },
});
