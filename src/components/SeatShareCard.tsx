import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { SeatShare } from '../types';
import { useSeatClaim } from '../hooks/useSeatClaim';

interface Props {
  share: SeatShare;
  userCar: number;
  userId: string;
  onPress?: () => void;
}

export function SeatShareCard({ share, userCar, userId, onPress }: Props) {
  const { claimSeat, getMyClaimStatus, isClaiming } = useSeatClaim();
  const [myStatus, setMyStatus] = useState<string | null>(null);

  const distance = Math.abs(share.car_number - userCar);
  const directionText = share.car_number > userCar ? '열차 방향' : share.car_number < userCar ? '열차 반대 방향' : '같은 칸';
  const distanceText = distance === 0 ? '같은 칸' : `${directionText} ${distance}칸 이동`;

  const isMyShare = share.user_id === userId;
  const isMatched = share.matched_user_id !== null;
  const isMatchedToMe = share.matched_user_id === userId;

  useEffect(() => {
    if (userId && share.id) {
      getMyClaimStatus(share.id, userId).then(setMyStatus);
    }
  }, [share.id, userId, share.matched_user_id]);

  const handleClaim = async () => {
    try {
      const result = await claimSeat(share.id, userId);
      if (result.alreadyClaimed) {
        Alert.alert('이미 신청했어요', '매칭 결과를 기다려주세요.');
        return;
      }
      if (result.matched) {
        Alert.alert('매칭 성공!', '자리 위치가 공개됩니다.');
        setMyStatus('matched');
      } else {
        Alert.alert('신청 완료', '매칭 결과를 기다려주세요.');
        setMyStatus('pending');
      }
    } catch {
      Alert.alert('신청 실패', '다시 시도해주세요.');
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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

        {/* Matched to me: show seat position */}
        {isMatchedToMe && share.seat_position ? (
          <View style={styles.matchedBox}>
            <Text style={styles.matchedLabel}>🎉 매칭 성공!</Text>
            <Text style={styles.seatPosition}>좌석: {share.seat_position}</Text>
          </View>
        ) : isMatchedToMe && !share.seat_position ? (
          <View style={styles.matchedBox}>
            <Text style={styles.matchedLabel}>🎉 매칭 성공!</Text>
            <Text style={styles.seatPosition}>좌석 정보 입력 대기 중</Text>
          </View>
        ) : null}

        {/* Claim button or status */}
        {!isMyShare && !isMatched && myStatus === null && (
          <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} disabled={isClaiming}>
            <Text style={styles.claimBtnText}>{isClaiming ? '신청 중...' : '자리 신청'}</Text>
          </TouchableOpacity>
        )}

        {!isMyShare && myStatus === 'pending' && !isMatched && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>매칭 대기 중</Text>
          </View>
        )}

        {!isMyShare && isMatched && !isMatchedToMe && myStatus === 'rejected' && (
          <View style={styles.rejectedBadge}>
            <Text style={styles.rejectedText}>다른 분에게 매칭됐어요</Text>
          </View>
        )}

        {!isMyShare && isMatched && !isMatchedToMe && myStatus === null && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>매칭 완료</Text>
          </View>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
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
  // Claim button
  claimBtn: { backgroundColor: '#3182F6', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  claimBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  // Status badges
  pendingBadge: { backgroundColor: '#FFF3E8', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  pendingText: { fontSize: 13, fontWeight: '600', color: '#FF6B00' },
  rejectedBadge: { backgroundColor: '#F7F8FA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  rejectedText: { fontSize: 13, color: '#8B95A1' },
  closedBadge: { backgroundColor: '#F7F8FA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  closedText: { fontSize: 13, color: '#8B95A1' },
  // Matched box
  matchedBox: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 12, marginTop: 10 },
  matchedLabel: { fontSize: 14, fontWeight: '700', color: '#00C853', marginBottom: 4 },
  seatPosition: { fontSize: 16, fontWeight: '600', color: '#191F28' },
  chevron: { fontSize: 24, color: '#B0B8C1', alignSelf: 'center' },
});
