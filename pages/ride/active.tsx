import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RideStatusCard } from '../../src/components/RideStatusCard';
import { useAuth } from '../../src/hooks/useAuth';
import { useActiveRide } from '../../src/hooks/useActiveRide';

export const Route = createRoute('/ride/active', { component: ActiveRidePage });

function ActiveRidePage() {
  const navigation = Route.useNavigation();
  const { userId } = useAuth();
  const { ride, updateStatus, cancelRide, getRemainingInfo } = useActiveRide(userId);
  const [remaining, setRemaining] = useState({ stations: 0, minutes: 0 });

  useEffect(() => {
    if (!ride) return;
    const update = () => setRemaining(getRemainingInfo());
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [ride, getRemainingInfo]);

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>활성 탑승이 없어요</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('/')}>
          <Text style={styles.backBtnText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>탑승 현황</Text>
      <RideStatusCard
        status={ride.status as 'riding' | 'arriving_soon' | 'arrived'}
        arrivalStation={ride.arrival_station}
        remainingStations={remaining.stations}
        remainingMinutes={remaining.minutes}
      />
      <View style={styles.routeInfo}>
        <Text style={styles.routeText}>{ride.departure_station} → {ride.arrival_station}</Text>
        <Text style={styles.directionText}>{ride.direction}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.arriveBtn} onPress={async () => { await updateStatus('arrived'); navigation.navigate('/'); }}>
          <Text style={styles.arriveBtnText}>지금 내려요</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={async () => { await cancelRide(); navigation.navigate('/'); }}>
          <Text style={styles.cancelBtnText}>오늘은 안 타요</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 16 },
  routeInfo: { backgroundColor: '#F7F8FA', padding: 16, borderRadius: 12, marginBottom: 24 },
  routeText: { fontSize: 16, fontWeight: '600', color: '#333' },
  directionText: { fontSize: 14, color: '#8B95A1', marginTop: 4 },
  actions: { gap: 12 },
  arriveBtn: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  arriveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cancelBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#8B95A1' },
  emptyText: { fontSize: 16, color: '#8B95A1', textAlign: 'center', marginTop: 40 },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 16, color: '#3182F6' },
});
