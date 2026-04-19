import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { useRoutine } from '../src/hooks/useRoutine';
import { useActiveRide } from '../src/hooks/useActiveRide';
import { RideStatusCard } from '../src/components/RideStatusCard';
import type { Direction } from '../src/types';

export const Route = createRoute('/', { component: DashboardPage });

function DashboardPage() {
  const navigation = Route.useNavigation();
  const { userId, isLoading: authLoading } = useAuth();
  const { routine, isLoading: routineLoading } = useRoutine(userId);
  const { ride, startRide, getRemainingInfo } = useActiveRide(userId);

  if (authLoading || routineLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182F6" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>로그인이 필요해요</Text>
        <Text style={styles.emptyDesc}>토스 앱에서 접속해주세요</Text>
      </View>
    );
  }

  if (ride && ride.status !== 'arrived') {
    const remaining = getRemainingInfo();
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mozy</Text>
        <RideStatusCard
          status={ride.status as 'riding' | 'arriving_soon'}
          arrivalStation={ride.arrival_station}
          remainingStations={remaining.stations}
          remainingMinutes={remaining.minutes}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('/ride/active')}>
          <Text style={styles.primaryBtnText}>탑승 상세 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedBtn} onPress={() => navigation.navigate('/feed')}>
          <Text style={styles.feedBtnText}>실시간 피드</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('/seat/finder')}>
          <Text style={styles.secondaryBtnText}>빈 자리 확인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mozy</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>나도 앉고 싶어요!</Text>
          <Text style={styles.cardDesc}>출퇴근 루틴을 등록하면 빈 자리 정보를 공유할 수 있어요</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('/routine/register')}>
            <Text style={styles.primaryBtnText}>루틴 등록하기</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.feedBtn} onPress={() => navigation.navigate('/feed')}>
          <Text style={styles.feedBtnText}>실시간 피드</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('/seat/finder')}>
          <Text style={styles.secondaryBtnText}>빈 자리 확인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRoutineTime = checkRoutineTime(routine.departure_time);

  const handleStartRide = async () => {
    try {
      await startRide({
        direction: routine.direction as Direction,
        departure_station: routine.departure_station,
        arrival_station: routine.arrival_station,
      });
      navigation.navigate('/ride/active');
    } catch { /* 에러 시 앱 차단하지 않음 */ }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mozy</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>내 루틴</Text>
        <Text style={styles.routeText}>{routine.departure_station} → {routine.arrival_station}</Text>
        <Text style={styles.dirText}>{routine.direction} · {routine.departure_time}</Text>
      </View>
      {isRoutineTime && (
        <TouchableOpacity style={styles.rideBtn} onPress={handleStartRide}>
          <Text style={styles.rideBtnText}>지금 탑승 중이에요!</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.feedBtn} onPress={() => navigation.navigate('/feed')}>
        <Text style={styles.feedBtnText}>실시간 피드</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('/seat/finder')}>
        <Text style={styles.secondaryBtnText}>빈 자리 확인하기</Text>
      </TouchableOpacity>
    </View>
  );
}

function checkRoutineTime(departureTime: string): boolean {
  const now = new Date();
  const [h, m] = departureTime.split(':').map(Number);
  const routineMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.abs(nowMinutes - routineMinutes) <= 30;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  center: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#191F28', marginBottom: 24 },
  card: { backgroundColor: '#F7F8FA', padding: 20, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#191F28', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#8B95A1', marginBottom: 16 },
  routeText: { fontSize: 16, fontWeight: '600', color: '#333' },
  dirText: { fontSize: 14, color: '#8B95A1', marginTop: 4 },
  primaryBtn: { backgroundColor: '#3182F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  feedBtn: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  feedBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  secondaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#8B95A1' },
  rideBtn: { backgroundColor: '#00C853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  rideBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#8B95A1', marginTop: 4 },
});
