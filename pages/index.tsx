import { createRoute } from '@granite-js/react-native';
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { DirectionPicker } from '../src/components/DirectionPicker';
import { StationPicker } from '../src/components/StationPicker';
import { CarSelector } from '../src/components/CarSelector';
import { SeatShareCard } from '../src/components/SeatShareCard';
import { ShareForm } from '../src/components/ShareForm';
import { ArrivalInfoCard } from '../src/components/ArrivalInfo';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { MySeatView } from '../src/components/MySeatView';
import { MyClaimsView } from '../src/components/MyClaimsView';
import { getStationNames, getStationsInDirection } from '../src/data/stations';
import { useAuth } from '../src/hooks/useAuth';
import { useRoutine } from '../src/hooks/useRoutine';
import { useSeatFeed } from '../src/hooks/useSeatFeed';
import { useArrivalInfo } from '../src/hooks/useArrivalInfo';
import { LINE_NAME } from '../src/constants';
import type { Direction } from '../src/types';

export const Route = createRoute('/', { component: HomePage, screenOptions: { headerShown: false } });

// Persist settings across navigations
let cachedSettings: {
  direction: Direction;
  departure: string;
  arrival: string;
  car: number;
} | null = null;

function HomePage() {
  const navigation = Route.useNavigation();
  const { userId, isLoading: authLoading } = useAuth();
  const { routine, isLoading: routineLoading } = useRoutine(userId);

  // Setup state
  const [direction, setDirection] = useState<Direction | null>(cachedSettings?.direction ?? null);
  const [departure, setDeparture] = useState<string | null>(cachedSettings?.departure ?? null);
  const [arrival, setArrival] = useState<string | null>(cachedSettings?.arrival ?? null);
  const [userCar, setUserCar] = useState(cachedSettings?.car ?? 5);
  const [isSetupDone, setIsSetupDone] = useState(cachedSettings !== null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const TABS = [
    { key: 'home', label: '홈', icon: '🏠' },
    { key: 'myseat', label: '내 자리', icon: '💺' },
    { key: 'claims', label: '신청 현황', icon: '🎫' },
  ];

  // Auto-populate from routine
  useEffect(() => {
    if (routine && !cachedSettings) {
      setDirection(routine.direction as Direction);
      setDeparture(routine.departure_station);
      setArrival(routine.arrival_station);
      setIsSetupDone(true);
      cachedSettings = {
        direction: routine.direction as Direction,
        departure: routine.departure_station,
        arrival: routine.arrival_station,
        car: 5,
      };
    }
  }, [routine]);

  // Feed data
  const { shares, isLoading: feedLoading, createShare } = useSeatFeed(LINE_NAME, direction, departure);
  const { arrivals, isLoading: arrivalLoading } = useArrivalInfo(departure);

  // Calculate recommended car (car with most shares = most departures soon)
  const recommendedCar = useMemo(() => {
    if (shares.length === 0) return null;
    const counts = new Map<number, number>();
    for (const s of shares) {
      counts.set(s.car_number, (counts.get(s.car_number) ?? 0) + 1);
    }
    let maxCar = shares[0].car_number;
    let maxCount = 0;
    for (const [car, count] of counts) {
      if (count > maxCount) {
        maxCar = car;
        maxCount = count;
      }
    }
    return maxCar;
  }, [shares]);

  // Sort shares by distance from user's car
  const sortedShares = useMemo(() => {
    return [...shares].sort((a, b) => Math.abs(a.car_number - userCar) - Math.abs(b.car_number - userCar));
  }, [shares, userCar]);

  const handleStartSetup = () => {
    if (!direction || !departure || !arrival) return;
    cachedSettings = { direction, departure, arrival, car: userCar };
    setIsSetupDone(true);
  };

  const handleShare = async (exitStation: string, exitMinutes: number, message: string, carNumber: number) => {
    if (!userId || !direction || !departure) return;
    await createShare({
      userId,
      direction,
      currentStation: departure,
      exitStation,
      exitMinutes,
      message,
      carNumber,
    });
    setShowShareForm(false);
  };

  if (authLoading || routineLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3182F6" />
      </SafeAreaView>
    );
  }

  // ── State 1: Setup ──
  if (!isSetupDone) {
    const allStations = getStationNames();
    const arrivalStations = direction && departure ? getStationsInDirection(direction, departure) : [];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView style={styles.container}>
        <Text style={styles.setupTitle}>Mozy</Text>
        <Text style={styles.setupDesc}>지하철 빈 자리를 실시간으로 확인하세요</Text>

        <DirectionPicker
          selected={direction}
          onSelect={(d) => {
            setDirection(d);
            setDeparture(null);
            setArrival(null);
          }}
        />

        {direction && (
          <StationPicker
            label="출발역"
            stations={allStations}
            selected={departure}
            onSelect={(s) => {
              setDeparture(s);
              setArrival(null);
            }}
          />
        )}

        {departure && (
          <StationPicker label="도착역" stations={arrivalStations} selected={arrival} onSelect={setArrival} />
        )}

        {arrival && (
          <>
            <CarSelector totalCars={10} selectedCar={userCar} recommendedCar={null} onSelect={setUserCar} />
            <TouchableOpacity style={styles.startBtn} onPress={handleStartSetup}>
              <Text style={styles.startBtnText}>시작하기</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      </SafeAreaView>
    );
  }

  // ── State 2: Main Feed ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
    <View style={styles.feedContainer}>
      {activeTab === 'home' && (
        <>
          <ScrollView style={styles.feedScroll}>
            {/* Route header */}
            <View style={styles.routeHeader}>
              <Text style={styles.routeArrows}>↕</Text>
              <View style={styles.lineBadge}>
                <Text style={styles.lineBadgeText}>2</Text>
              </View>
              <Text style={styles.routeText}>
                {departure} ··· {arrival}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  cachedSettings = null;
                  setIsSetupDone(false);
                }}
              >
                <Text style={styles.editBtn}>수정</Text>
              </TouchableOpacity>
            </View>

            {/* Headline */}
            {recommendedCar && (
              <Text style={styles.headline}>
                {recommendedCar}번 칸에 곧 빌 자리가{'\n'}가장 많아요
              </Text>
            )}
            {!recommendedCar && shares.length === 0 && (
              <Text style={styles.headline}>빈 자리 정보를{'\n'}기다리고 있어요</Text>
            )}

            {/* Car selector */}
            <CarSelector
              totalCars={10}
              selectedCar={userCar}
              recommendedCar={recommendedCar}
              onSelect={(c) => {
                setUserCar(c);
                if (cachedSettings) cachedSettings.car = c;
              }}
            />

            {/* Arrival info */}
            <ArrivalInfoCard arrivals={arrivals} isLoading={arrivalLoading} />

            {/* Share form */}
            {showShareForm && direction && departure && (
              <ShareForm
                direction={direction}
                currentStation={departure}
                userCar={userCar}
                onSubmit={handleShare}
                onCancel={() => setShowShareForm(false)}
              />
            )}

            {/* Feed header */}
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>
                이 열차의 빈자리 <Text style={styles.feedCount}>{shares.length}</Text>
              </Text>
              <Text style={styles.feedSort}>가까운 순</Text>
            </View>

            {/* Feed list */}
            {feedLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#3182F6" />
            ) : sortedShares.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyTitle}>아직 공유된 정보가 없어요</Text>
                <Text style={styles.emptyDesc}>첫 번째로 자리를 공유해보세요!</Text>
              </View>
            ) : (
              sortedShares.map((share) => (
                <SeatShareCard
                  key={share.id}
                  share={share}
                  userCar={userCar}
                  onPress={() => navigation.navigate('/seat/detail', { shareId: share.id, userCar: String(userCar) })}
                />
              ))
            )}
          </ScrollView>

        </>
      )}

      {/* FAB - 홈탭에서 항상 표시 */}
      {activeTab === 'home' && !showShareForm && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowShareForm(true)}>
          <Text style={styles.fabText}>+ 내 자리 공유</Text>
        </TouchableOpacity>
      )}

      {activeTab === 'myseat' && userId && (
        <MySeatView userId={userId} />
      )}

      {activeTab === 'claims' && userId && (
        <MyClaimsView userId={userId} />
      )}

      <BottomTabBar tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  center: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  feedContainer: { flex: 1, backgroundColor: '#FFF' },
  feedScroll: { flex: 1, padding: 16 },

  // Setup
  setupTitle: { fontSize: 28, fontWeight: '800', color: '#191F28', marginBottom: 4 },
  setupDesc: { fontSize: 14, color: '#8B95A1', marginBottom: 24 },
  startBtn: { backgroundColor: '#3182F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Route header
  routeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeArrows: { fontSize: 18, color: '#8B95A1', marginRight: 8 },
  lineBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  lineBadgeText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  routeText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#191F28' },
  editBtn: { fontSize: 14, color: '#3182F6' },

  // Headline
  headline: { fontSize: 24, fontWeight: '800', color: '#191F28', marginBottom: 16, lineHeight: 32 },

  // Feed header
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 8 },
  feedTitle: { fontSize: 16, fontWeight: '700', color: '#191F28' },
  feedCount: { color: '#3182F6' },
  feedSort: { fontSize: 13, color: '#8B95A1' },

  // Empty
  emptyFeed: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: '#8B95A1' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: '#191F28',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  fabText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
