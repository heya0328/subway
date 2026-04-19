# Mozy V2 — UX 개선 + 실시간 피드 + 공공 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 역 검색 UX 개선, 서울교통공사 공공 API 실시간 도착/혼잡도 연동, 실시간 좌석 공유 피드 추가.

**Architecture:** 기존 StationPicker를 검색 가능하게 리팩토링, 공공 API 래퍼+훅 추가, 새 Supabase 테이블(seat_shares)+Realtime 피드 페이지 추가.

**Tech Stack:** React Native (Granite), Supabase Realtime, 서울교통공사 Open API

**Spec:** `docs/superpowers/specs/2026-04-19-v2-ux-feed-api-design.md`

---

### Task 1: SearchableStationPicker 리팩토링

**Files:**
- Modify: `src/components/StationPicker.tsx`

- [ ] **Step 1: 검색 기능이 추가된 StationPicker로 교체**

Replace `src/components/StationPicker.tsx` with:

```tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  label: string;
  stations: string[];
  selected: string | null;
  onSelect: (station: string) => void;
}

const recentStations: string[] = [];

function addRecent(name: string) {
  const idx = recentStations.indexOf(name);
  if (idx !== -1) recentStations.splice(idx, 1);
  recentStations.unshift(name);
  if (recentStations.length > 3) recentStations.pop();
}

export function StationPicker({ label, stations, selected, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return stations;
    return stations.filter((s) => s.includes(query.trim()));
  }, [stations, query]);

  const recents = recentStations.filter((s) => stations.includes(s));

  const handleSelect = (name: string) => {
    addRecent(name);
    onSelect(name);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder="역 이름 검색"
        placeholderTextColor="#B0B8C1"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      {recents.length > 0 && !query && (
        <View style={styles.recentRow}>
          {recents.map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.recentChip, selected === name && styles.recentChipSelected]}
              onPress={() => handleSelect(name)}
            >
              <Text style={[styles.recentText, selected === name && styles.recentTextSelected]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView style={styles.list} nestedScrollEnabled>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>검색 결과가 없어요</Text>
        ) : (
          filtered.map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.item, selected === name && styles.itemSelected]}
              onPress={() => handleSelect(name)}
            >
              <Text style={[styles.itemText, selected === name && styles.itemTextSelected]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { height: 44, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#191F28', marginBottom: 8 },
  recentRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  recentChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F7F8FA' },
  recentChipSelected: { backgroundColor: '#E8F0FE' },
  recentText: { fontSize: 13, color: '#8B95A1' },
  recentTextSelected: { color: '#3182F6', fontWeight: '600' },
  list: { maxHeight: 200, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8 },
  item: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemSelected: { backgroundColor: '#E8F0FE' },
  itemText: { fontSize: 16, color: '#333' },
  itemTextSelected: { color: '#3182F6', fontWeight: '600' },
  emptyText: { padding: 16, textAlign: 'center', color: '#8B95A1', fontSize: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StationPicker.tsx
git commit -m "feat: add search and recent stations to StationPicker"
```

---

### Task 2: 서울교통공사 공공 API 래퍼

**Files:**
- Create: `src/data/seoulMetroApi.ts`
- Create: `src/types/metro.ts`

- [ ] **Step 1: Metro API 타입 정의**

Create `src/types/metro.ts`:

```ts
export interface ArrivalInfo {
  trainLineNm: string;   // "2호선" 등
  arvlMsg2: string;       // "2분 후 도착" 등 도착 메시지
  arvlMsg3: string;       // "전역 출발" 등 상세
  updnLine: string;       // "상행" | "하행"
  barvlDt: string;        // 도착까지 남은 초
  lstcarAt: string;       // "1": 막차
}

export interface MetroArrivalResponse {
  realtimeArrivalList?: ArrivalInfo[];
}
```

- [ ] **Step 2: API 래퍼 생성**

Create `src/data/seoulMetroApi.ts`:

```ts
import type { ArrivalInfo } from '../types/metro';

const API_KEY = '4e457a6a4b73756e3130396a42744c';
const BASE_URL = 'http://swopenapi.seoul.go.kr/api/subway';

export async function fetchArrivalInfo(stationName: string): Promise<ArrivalInfo[]> {
  try {
    const url = `${BASE_URL}/${API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(stationName)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.realtimeArrivalList) return [];
    return data.realtimeArrivalList.filter(
      (item: ArrivalInfo) => item.trainLineNm.includes('2호선')
    );
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/metro.ts src/data/seoulMetroApi.ts
git commit -m "feat: add Seoul Metro public API wrapper"
```

---

### Task 3: 실시간 도착 정보 훅 + 컴포넌트

**Files:**
- Create: `src/hooks/useArrivalInfo.ts`
- Create: `src/components/ArrivalInfo.tsx`

- [ ] **Step 1: useArrivalInfo 훅 생성**

Create `src/hooks/useArrivalInfo.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { fetchArrivalInfo } from '../data/seoulMetroApi';
import type { ArrivalInfo } from '../types/metro';

export function useArrivalInfo(stationName: string | null) {
  const [arrivals, setArrivals] = useState<ArrivalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!stationName) return;
    setIsLoading(true);
    try {
      const data = await fetchArrivalInfo(stationName);
      setArrivals(data);
    } catch {
      setArrivals([]);
    } finally {
      setIsLoading(false);
    }
  }, [stationName]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { arrivals, isLoading, refresh };
}
```

- [ ] **Step 2: ArrivalInfo 컴포넌트 생성**

Create `src/components/ArrivalInfo.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ArrivalInfo as ArrivalInfoType } from '../types/metro';

interface Props {
  arrivals: ArrivalInfoType[];
  isLoading: boolean;
}

export function ArrivalInfoCard({ arrivals, isLoading }: Props) {
  if (isLoading) return null;
  if (arrivals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>실시간 열차 정보</Text>
      {arrivals.slice(0, 4).map((item, idx) => {
        const seconds = parseInt(item.barvlDt, 10);
        const minutes = Math.ceil(seconds / 60);
        const timeText = seconds <= 0 ? '곧 도착' : `${minutes}분 후`;

        return (
          <View key={idx} style={styles.row}>
            <View style={styles.dirBadge}>
              <Text style={styles.dirText}>
                {item.updnLine === '상행' ? '내선' : '외선'}
              </Text>
            </View>
            <Text style={styles.msg}>{item.arvlMsg2}</Text>
            <Text style={styles.time}>{timeText}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F0F7FF', padding: 16, borderRadius: 12, marginBottom: 16 },
  header: { fontSize: 14, fontWeight: '700', color: '#3182F6', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dirBadge: { backgroundColor: '#3182F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  dirText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  msg: { flex: 1, fontSize: 14, color: '#333' },
  time: { fontSize: 14, fontWeight: '600', color: '#3182F6' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useArrivalInfo.ts src/components/ArrivalInfo.tsx
git commit -m "feat: add useArrivalInfo hook and ArrivalInfoCard component"
```

---

### Task 4: seat/finder.tsx에 도착 정보 통합

**Files:**
- Modify: `pages/seat/finder.tsx`

- [ ] **Step 1: ArrivalInfoCard를 finder 페이지에 추가**

`pages/seat/finder.tsx`의 import 섹션에 추가:
```tsx
import { ArrivalInfoCard } from '../../src/components/ArrivalInfo';
import { useArrivalInfo } from '../../src/hooks/useArrivalInfo';
```

`SeatFinderPage` 함수 내에 훅 추가:
```tsx
const { arrivals, isLoading: arrivalLoading } = useArrivalInfo(currentStation);
```

`{currentStation && (` 블록 안, DepartureList 위에 추가:
```tsx
<ArrivalInfoCard arrivals={arrivals} isLoading={arrivalLoading} />
```

- [ ] **Step 2: Commit**

```bash
git add pages/seat/finder.tsx
git commit -m "feat: integrate arrival info into seat finder page"
```

---

### Task 5: seat_shares 테이블 + Supabase 스키마

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: seat_shares 테이블 SQL 추가**

Append to `supabase/schema.sql`:

```sql
-- seat_shares table (실시간 좌석 공유 피드)
CREATE TABLE IF NOT EXISTS seat_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  direction text NOT NULL,
  current_station text NOT NULL,
  exit_station text NOT NULL,
  exit_minutes int NOT NULL,
  message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE seat_shares DISABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE seat_shares;
```

- [ ] **Step 2: Supabase Dashboard에서 SQL 실행**

위 SQL을 Supabase Dashboard > SQL Editor에서 실행.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add seat_shares table schema"
```

---

### Task 6: SeatShare 타입 + useSeatFeed 훅

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/hooks/useSeatFeed.ts`

- [ ] **Step 1: SeatShare 타입 추가**

`src/types/index.ts` 맨 아래에 추가:

```ts
export interface SeatShare {
  id: string;
  user_id: string;
  line: string;
  direction: Direction;
  current_station: string;
  exit_station: string;
  exit_minutes: number;
  message: string;
  created_at: string;
  expires_at: string;
}
```

- [ ] **Step 2: useSeatFeed 훅 생성**

Create `src/hooks/useSeatFeed.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../data/supabase';
import type { Direction, SeatShare } from '../types';

export function useSeatFeed(
  line: string,
  direction: Direction | null,
  currentStation: string | null
) {
  const [shares, setShares] = useState<SeatShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchShares = useCallback(async () => {
    if (!direction || !currentStation) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('seat_shares')
        .select('*')
        .eq('line', line)
        .eq('direction', direction)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      setShares(data ?? []);
    } catch {
      setShares([]);
    } finally {
      setIsLoading(false);
    }
  }, [line, direction, currentStation]);

  useEffect(() => { fetchShares(); }, [fetchShares]);

  useEffect(() => {
    if (!direction) return;
    const channel = supabase
      .channel('seat-shares-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_shares', filter: `line=eq.${line}` }, () => { fetchShares(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [line, direction, fetchShares]);

  const createShare = useCallback(async (params: {
    userId: string;
    direction: Direction;
    currentStation: string;
    exitStation: string;
    exitMinutes: number;
    message: string;
  }) => {
    const expiresAt = new Date(Date.now() + (params.exitMinutes + 5) * 60 * 1000);
    const { error } = await supabase.from('seat_shares').insert({
      user_id: params.userId,
      line,
      direction: params.direction,
      current_station: params.currentStation,
      exit_station: params.exitStation,
      exit_minutes: params.exitMinutes,
      message: params.message,
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw error;
    fetchShares();
  }, [line, fetchShares]);

  return { shares, isLoading, createShare, refresh: fetchShares };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/hooks/useSeatFeed.ts
git commit -m "feat: add SeatShare type and useSeatFeed hook"
```

---

### Task 7: SeatShareCard + ShareForm 컴포넌트

**Files:**
- Create: `src/components/SeatShareCard.tsx`
- Create: `src/components/ShareForm.tsx`

- [ ] **Step 1: SeatShareCard 생성**

Create `src/components/SeatShareCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeatShare } from '../types';

interface Props {
  share: SeatShare;
}

export function SeatShareCard({ share }: Props) {
  const createdAt = new Date(share.created_at);
  const now = new Date();
  const agoMinutes = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60000));
  const agoText = agoMinutes === 0 ? '방금' : `${agoMinutes}분 전`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{share.exit_minutes}분 후 하차</Text>
        </View>
        <Text style={styles.ago}>{agoText}</Text>
      </View>
      <Text style={styles.route}>
        {share.current_station} → {share.exit_station}
      </Text>
      {share.message ? (
        <Text style={styles.message}>{share.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 12, padding: 16, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { backgroundColor: '#FF6B00', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  ago: { fontSize: 12, color: '#8B95A1' },
  route: { fontSize: 16, fontWeight: '600', color: '#191F28', marginBottom: 4 },
  message: { fontSize: 14, color: '#4E5968', marginTop: 4 },
});
```

- [ ] **Step 2: ShareForm 생성**

Create `src/components/ShareForm.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StationPicker } from './StationPicker';
import { getStationsInDirection } from '../data/stations';
import type { Direction } from '../types';

interface Props {
  direction: Direction;
  currentStation: string;
  onSubmit: (exitStation: string, exitMinutes: number, message: string) => Promise<void>;
  onCancel: () => void;
}

const MINUTE_OPTIONS = [1, 3, 5, 10, 15, 20];

export function ShareForm({ direction, currentStation, onSubmit, onCancel }: Props) {
  const [exitStation, setExitStation] = useState<string | null>(null);
  const [exitMinutes, setExitMinutes] = useState(5);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const upcomingStations = getStationsInDirection(direction, currentStation);

  const handleSubmit = async () => {
    if (!exitStation) return;
    setIsSending(true);
    try {
      await onSubmit(exitStation, exitMinutes, message);
    } catch {
      Alert.alert('전송 실패', '다시 시도해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>나도 내려요!</Text>

      <StationPicker
        label="하차 예정역"
        stations={upcomingStations}
        selected={exitStation}
        onSelect={setExitStation}
      />

      <Text style={styles.label}>약 몇 분 후 하차?</Text>
      <View style={styles.minuteRow}>
        {MINUTE_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.minuteChip, exitMinutes === m && styles.minuteChipSelected]}
            onPress={() => setExitMinutes(m)}
          >
            <Text style={[styles.minuteText, exitMinutes === m && styles.minuteTextSelected]}>
              {m}분
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>메시지 (선택)</Text>
      <TextInput
        style={styles.messageInput}
        placeholder="예: 창가 자리예요"
        placeholderTextColor="#B0B8C1"
        value={message}
        onChangeText={setMessage}
        maxLength={50}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, !exitStation && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!exitStation || isSending}
        >
          <Text style={styles.submitBtnText}>{isSending ? '전송 중...' : '공유하기'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  minuteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  minuteChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  minuteChipSelected: { borderColor: '#FF6B00', backgroundColor: '#FFF3E8' },
  minuteText: { fontSize: 14, color: '#666' },
  minuteTextSelected: { color: '#FF6B00', fontWeight: '600' },
  messageInput: { height: 44, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#191F28', marginBottom: 20 },
  actions: { gap: 10 },
  submitBtn: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#B0B8C1' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#8B95A1' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SeatShareCard.tsx src/components/ShareForm.tsx
git commit -m "feat: add SeatShareCard and ShareForm components"
```

---

### Task 8: 피드 페이지

**Files:**
- Create: `pages/feed/index.tsx`

- [ ] **Step 1: 피드 페이지 생성**

Run: `mkdir -p pages/feed`

Create `pages/feed/index.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add pages/feed/
git commit -m "feat: add realtime seat share feed page"
```

---

### Task 9: 홈 대시보드에 피드 버튼 추가

**Files:**
- Modify: `pages/index.tsx`

- [ ] **Step 1: 홈에 "실시간 피드" 버튼 추가**

`pages/index.tsx`에서 모든 return 블록의 "빈 자리 확인하기" `secondaryBtn` 바로 위에 피드 버튼 추가:

```tsx
<TouchableOpacity style={styles.feedBtn} onPress={() => navigation.navigate('/feed')}>
  <Text style={styles.feedBtnText}>실시간 피드</Text>
</TouchableOpacity>
```

styles에 추가:
```tsx
feedBtn: { backgroundColor: '#FF6B00', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
feedBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
```

- [ ] **Step 2: Commit**

```bash
git add pages/index.tsx
git commit -m "feat: add realtime feed button to home dashboard"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | SearchableStationPicker | `src/components/StationPicker.tsx` |
| 2 | Seoul Metro API wrapper | `src/data/seoulMetroApi.ts`, `src/types/metro.ts` |
| 3 | ArrivalInfo hook + component | `src/hooks/useArrivalInfo.ts`, `src/components/ArrivalInfo.tsx` |
| 4 | Finder에 도착 정보 통합 | `pages/seat/finder.tsx` |
| 5 | seat_shares 테이블 | `supabase/schema.sql` |
| 6 | SeatShare 타입 + useSeatFeed | `src/types/index.ts`, `src/hooks/useSeatFeed.ts` |
| 7 | SeatShareCard + ShareForm | `src/components/SeatShareCard.tsx`, `src/components/ShareForm.tsx` |
| 8 | 피드 페이지 | `pages/feed/index.tsx` |
| 9 | 홈에 피드 버튼 | `pages/index.tsx` |
