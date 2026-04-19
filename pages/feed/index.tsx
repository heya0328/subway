import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { DirectionPicker } from '../../src/components/DirectionPicker';
import { StationPicker } from '../../src/components/StationPicker';
import { SeatShareCard } from '../../src/components/SeatShareCard';
import { ShareForm } from '../../src/components/ShareForm';
import { ArrivalInfoCard } from '../../src/components/ArrivalInfo';
import { getStationNames } from '../../src/data/stations';
import { useAuth } from '../../src/hooks/useAuth';
import { useSeatFeed } from '../../src/hooks/useSeatFeed';
import { useArrivalInfo } from '../../src/hooks/useArrivalInfo';
import { LINE_NAME } from '../../src/constants';
import type { Direction } from '../../src/types';

export const Route = createRoute('/feed', { component: FeedPage });

function FeedPage() {
  const { userId } = useAuth();
  const [direction, setDirection] = useState<Direction | null>(null);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { shares, isLoading, createShare } = useSeatFeed(LINE_NAME, direction, currentStation);
  const { arrivals, isLoading: arrivalLoading } = useArrivalInfo(currentStation);

  const handleSubmit = async (exitStation: string, exitMinutes: number, message: string) => {
    if (!userId || !direction || !currentStation) return;
    await createShare({
      userId,
      direction,
      currentStation,
      exitStation,
      exitMinutes,
      message,
    });
    setShowForm(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>실시간 피드</Text>
      <Text style={styles.subtitle}>곧 내리는 사람들의 실시간 공유</Text>

      <DirectionPicker selected={direction} onSelect={setDirection} />

      {direction && (
        <StationPicker
          label="현재역"
          stations={getStationNames()}
          selected={currentStation}
          onSelect={setCurrentStation}
        />
      )}

      {currentStation && (
        <>
          <ArrivalInfoCard arrivals={arrivals} isLoading={arrivalLoading} />

          {showForm ? (
            <ShareForm
              direction={direction!}
              currentStation={currentStation}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <TouchableOpacity style={styles.shareBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.shareBtnText}>나도 내려요!</Text>
            </TouchableOpacity>
          )}

          {isLoading ? (
            <Text style={styles.loading}>불러오는 중...</Text>
          ) : shares.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>아직 공유된 정보가 없어요</Text>
              <Text style={styles.emptyDesc}>첫 번째로 공유해보세요!</Text>
            </View>
          ) : (
            shares.map((share) => (
              <SeatShareCard key={share.id} share={share} />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 20 },
  shareBtn: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  loading: { fontSize: 14, color: '#8B95A1', textAlign: 'center', marginTop: 20 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: '#8B95A1' },
});
