# Subway Seat Finder MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Apps-in-Toss RN mini app where commuters share when they'll exit the subway, so standing passengers can find soon-to-be-empty seats on Line 2.

**Architecture:** Granite-based React Native mini app with Supabase backend. Users register a commute routine once, then one-tap to activate "riding" status each day. Standing users see real-time departure counts per station via Supabase Realtime subscriptions.

**Tech Stack:** React Native (Granite), TDS React Native, Supabase (PostgreSQL + Realtime), Apps-in-Toss SDK

**Spec:** `docs/superpowers/specs/2026-04-18-subway-seat-finder-design.md`

---

### Task 1: Install dependencies and create directory structure

**Files:**
- Modify: `package.json`
- Create: `src/types/index.ts`
- Create: `src/constants/index.ts`

- [ ] **Step 1: Install Supabase client**

Run: `npm install @supabase/supabase-js`

- [ ] **Step 2: Create source directories**

Run: `mkdir -p src/{components,hooks,data,types,constants}`

- [ ] **Step 3: Create shared types**

Create `src/types/index.ts`:

```ts
export interface Station {
  name: string;
  order: number;
  seconds_to_next: number;
}

export interface LineData {
  line: string;
  stations: Station[];
}

export type Direction = '외선순환' | '내선순환';

export interface Routine {
  id: string;
  user_id: string;
  line: string;
  direction: Direction;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RideStatus = 'riding' | 'arriving_soon' | 'arrived';

export interface ActiveRide {
  id: string;
  user_id: string;
  line: string;
  direction: Direction;
  departure_station: string;
  arrival_station: string;
  status: RideStatus;
  activated_at: string;
  estimated_arrival: string;
  expires_at: string;
}

export interface SeatReport {
  id: string;
  user_id: string;
  line: string;
  station: string;
  created_at: string;
}

export interface DepartureCount {
  arrival_station: string;
  departing_count: number;
}
```

- [ ] **Step 4: Create constants**

Create `src/constants/index.ts`:

```ts
export const ARRIVING_SOON_SECONDS = 180; // 3분 전
export const RIDE_TTL_MINUTES = 30; // 만료 여유 시간
export const LINE_NAME = '2호선';
export const DIRECTIONS: readonly string[] = ['외선순환', '내선순환'] as const;
```

- [ ] **Step 5: Commit**

```bash
git add src/ package.json package-lock.json
git commit -m "feat: add types, constants, and supabase dependency"
```

---

### Task 2: Line 2 station data and utility functions

**Files:**
- Create: `src/data/line2.json`
- Create: `src/data/stations.ts`

- [ ] **Step 1: Create 2호선 station data**

Create `src/data/line2.json`:

```json
{
  "line": "2호선",
  "stations": [
    { "name": "시청", "order": 0, "seconds_to_next": 120 },
    { "name": "을지로입구", "order": 1, "seconds_to_next": 90 },
    { "name": "을지로3가", "order": 2, "seconds_to_next": 90 },
    { "name": "을지로4가", "order": 3, "seconds_to_next": 90 },
    { "name": "동대문역사문화공원", "order": 4, "seconds_to_next": 120 },
    { "name": "신당", "order": 5, "seconds_to_next": 90 },
    { "name": "상왕십리", "order": 6, "seconds_to_next": 90 },
    { "name": "왕십리", "order": 7, "seconds_to_next": 120 },
    { "name": "한양대", "order": 8, "seconds_to_next": 90 },
    { "name": "뚝섬", "order": 9, "seconds_to_next": 90 },
    { "name": "성수", "order": 10, "seconds_to_next": 120 },
    { "name": "건대입구", "order": 11, "seconds_to_next": 120 },
    { "name": "구의", "order": 12, "seconds_to_next": 90 },
    { "name": "강변", "order": 13, "seconds_to_next": 120 },
    { "name": "잠실나루", "order": 14, "seconds_to_next": 90 },
    { "name": "잠실", "order": 15, "seconds_to_next": 120 },
    { "name": "잠실새내", "order": 16, "seconds_to_next": 90 },
    { "name": "종합운동장", "order": 17, "seconds_to_next": 120 },
    { "name": "삼성", "order": 18, "seconds_to_next": 90 },
    { "name": "선릉", "order": 19, "seconds_to_next": 90 },
    { "name": "역삼", "order": 20, "seconds_to_next": 90 },
    { "name": "강남", "order": 21, "seconds_to_next": 120 },
    { "name": "교대", "order": 22, "seconds_to_next": 90 },
    { "name": "서초", "order": 23, "seconds_to_next": 90 },
    { "name": "방배", "order": 24, "seconds_to_next": 120 },
    { "name": "사당", "order": 25, "seconds_to_next": 120 },
    { "name": "낙성대", "order": 26, "seconds_to_next": 90 },
    { "name": "서울대입구", "order": 27, "seconds_to_next": 90 },
    { "name": "봉천", "order": 28, "seconds_to_next": 90 },
    { "name": "신림", "order": 29, "seconds_to_next": 120 },
    { "name": "신대방", "order": 30, "seconds_to_next": 90 },
    { "name": "구로디지털단지", "order": 31, "seconds_to_next": 120 },
    { "name": "대림", "order": 32, "seconds_to_next": 120 },
    { "name": "신도림", "order": 33, "seconds_to_next": 120 },
    { "name": "문래", "order": 34, "seconds_to_next": 90 },
    { "name": "영등포구청", "order": 35, "seconds_to_next": 120 },
    { "name": "당산", "order": 36, "seconds_to_next": 120 },
    { "name": "합정", "order": 37, "seconds_to_next": 90 },
    { "name": "홍대입구", "order": 38, "seconds_to_next": 90 },
    { "name": "신촌", "order": 39, "seconds_to_next": 90 },
    { "name": "이대", "order": 40, "seconds_to_next": 90 },
    { "name": "아현", "order": 41, "seconds_to_next": 90 },
    { "name": "충정로", "order": 42, "seconds_to_next": 120 }
  ]
}
```

- [ ] **Step 2: Create station utility functions**

Create `src/data/stations.ts`:

```ts
import lineData from './line2.json';
import type { Station, Direction } from '../types';

const stations: Station[] = lineData.stations;
const totalStations = stations.length;

export function getAllStations(): Station[] {
  return stations;
}

export function getStationNames(): string[] {
  return stations.map((s) => s.name);
}

function getStationIndex(name: string): number {
  const idx = stations.findIndex((s) => s.name === name);
  if (idx === -1) throw new Error(`Unknown station: ${name}`);
  return idx;
}

export function getStationsInDirection(
  direction: Direction,
  fromStation: string
): string[] {
  const fromIdx = getStationIndex(fromStation);
  const result: string[] = [];

  if (direction === '외선순환') {
    for (let i = 1; i < totalStations; i++) {
      result.push(stations[(fromIdx + i) % totalStations].name);
    }
  } else {
    for (let i = 1; i < totalStations; i++) {
      result.push(
        stations[(fromIdx - i + totalStations) % totalStations].name
      );
    }
  }
  return result;
}

export function getTravelTimeSeconds(
  direction: Direction,
  fromStation: string,
  toStation: string
): number {
  const fromIdx = getStationIndex(fromStation);
  const toIdx = getStationIndex(toStation);
  let totalSeconds = 0;

  if (direction === '외선순환') {
    let i = fromIdx;
    while (i !== toIdx) {
      totalSeconds += stations[i].seconds_to_next;
      i = (i + 1) % totalStations;
    }
  } else {
    let i = fromIdx;
    while (i !== toIdx) {
      const prev = (i - 1 + totalStations) % totalStations;
      totalSeconds += stations[prev].seconds_to_next;
      i = prev;
    }
  }
  return totalSeconds;
}

export function getRemainingStationCount(
  direction: Direction,
  currentStation: string,
  arrivalStation: string
): number {
  const names = getStationsInDirection(direction, currentStation);
  const idx = names.indexOf(arrivalStation);
  return idx === -1 ? 0 : idx + 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/data/
git commit -m "feat: add Line 2 station data and utility functions"
```

---

### Task 3: Supabase client and database schema

**Files:**
- Create: `src/data/supabase.ts`
- Create: `supabase/schema.sql`

- [ ] **Step 1: Create Supabase client**

Create `src/data/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ewmfbkrlfjytjzaxbvex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_34gHz5ZDBGrfwocQ7oOa-Q_HfgLSE-H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- [ ] **Step 2: Create database schema SQL**

Create `supabase/schema.sql`:

```sql
-- routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  direction text NOT NULL,
  departure_station text NOT NULL,
  arrival_station text NOT NULL,
  departure_time time NOT NULL,
  days_of_week int[] NOT NULL DEFAULT '{0,1,2,3,4}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- active_rides table
CREATE TABLE IF NOT EXISTS active_rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  direction text NOT NULL,
  departure_station text NOT NULL,
  arrival_station text NOT NULL,
  status text NOT NULL DEFAULT 'riding',
  activated_at timestamptz NOT NULL DEFAULT now(),
  estimated_arrival timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_rides_query
  ON active_rides (line, direction, status, expires_at);

-- seat_reports table
CREATE TABLE IF NOT EXISTS seat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  station text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Realtime on active_rides
ALTER PUBLICATION supabase_realtime ADD TABLE active_rides;

-- TTL cleanup: run via Supabase Dashboard > SQL Editor > pg_cron
-- SELECT cron.schedule('cleanup-expired-rides', '*/10 * * * *',
--   $$DELETE FROM active_rides WHERE expires_at < NOW()$$
-- );
```

- [ ] **Step 3: Run schema in Supabase**

Run the SQL above in the Supabase Dashboard > SQL Editor. Also enable Realtime for `active_rides` table in Dashboard > Database > Replication.

- [ ] **Step 4: Commit**

```bash
git add src/data/supabase.ts supabase/
git commit -m "feat: add Supabase client and database schema"
```

---

### Task 4: Auth hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create useAuth hook**

Create `src/hooks/useAuth.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function authenticate() {
      try {
        const { AppLogin } = await import('@apps-in-toss/framework');
        if (AppLogin.isSupported?.()) {
          const result = await AppLogin.login();
          setState({ userId: result.userId, isLoading: false, error: null });
          return;
        }
      } catch {
        // 비토스 환경
      }

      // 폴백: 로컬 UUID 생성
      const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setState({ userId: fallbackId, isLoading: false, error: null });
    }

    authenticate();
  }, []);

  const retry = useCallback(() => {
    setState({ userId: null, isLoading: true, error: null });
  }, []);

  return { ...state, retry };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook with toss login + local fallback"
```

---

### Task 5: UI Components

**Files:**
- Create: `src/components/StationPicker.tsx`
- Create: `src/components/DirectionPicker.tsx`
- Create: `src/components/RideStatusCard.tsx`
- Create: `src/components/DepartureList.tsx`

- [ ] **Step 1: Create StationPicker**

Create `src/components/StationPicker.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  label: string;
  stations: string[];
  selected: string | null;
  onSelect: (station: string) => void;
}

export function StationPicker({ label, stations, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView style={styles.list} nestedScrollEnabled>
        {stations.map((name) => (
          <TouchableOpacity
            key={name}
            style={[styles.item, selected === name && styles.itemSelected]}
            onPress={() => onSelect(name)}
          >
            <Text style={[styles.itemText, selected === name && styles.itemTextSelected]}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  list: { maxHeight: 200, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8 },
  item: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemSelected: { backgroundColor: '#E8F0FE' },
  itemText: { fontSize: 16, color: '#333' },
  itemTextSelected: { color: '#3182F6', fontWeight: '600' },
});
```

- [ ] **Step 2: Create DirectionPicker**

Create `src/components/DirectionPicker.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Direction } from '../types';
import { DIRECTIONS } from '../constants';

interface Props {
  selected: Direction | null;
  onSelect: (direction: Direction) => void;
}

export function DirectionPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>방향</Text>
      <View style={styles.row}>
        {DIRECTIONS.map((dir) => (
          <TouchableOpacity
            key={dir}
            style={[styles.button, selected === dir && styles.buttonSelected]}
            onPress={() => onSelect(dir as Direction)}
          >
            <Text style={[styles.text, selected === dir && styles.textSelected]}>
              {dir}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center' },
  buttonSelected: { borderColor: '#3182F6', backgroundColor: '#E8F0FE' },
  text: { fontSize: 16, color: '#666' },
  textSelected: { color: '#3182F6', fontWeight: '600' },
});
```

- [ ] **Step 3: Create RideStatusCard**

Create `src/components/RideStatusCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RideStatus } from '../types';

interface Props {
  status: RideStatus;
  arrivalStation: string;
  remainingStations: number;
  remainingMinutes: number;
}

const STATUS_CONFIG = {
  riding: { label: '탑승 중', color: '#3182F6', bg: '#E8F0FE' },
  arriving_soon: { label: '곧 내려요', color: '#FF6B00', bg: '#FFF3E8' },
  arrived: { label: '도착', color: '#00C853', bg: '#E8F5E9' },
};

export function RideStatusCard({ status, arrivalStation, remainingStations, remainingMinutes }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.card, { backgroundColor: config.bg }]}>
      <View style={styles.statusBadge}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
      <Text style={styles.destination}>{arrivalStation} 하차 예정</Text>
      <Text style={styles.info}>
        {remainingStations}개 역 남음 · 약 {remainingMinutes}분
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 12, marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: '700' },
  destination: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  info: { fontSize: 14, color: '#8B95A1' },
});
```

- [ ] **Step 4: Create DepartureList**

Create `src/components/DepartureList.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DepartureCount } from '../types';

interface Props {
  departures: DepartureCount[];
  currentStation: string;
}

export function DepartureList({ departures, currentStation }: Props) {
  if (departures.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>아직 공유 중인 사용자가 없어요</Text>
        <Text style={styles.emptyDesc}>먼저 루틴을 등록해보세요!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{currentStation} 이후 하차 예정</Text>
      {departures.map((item) => (
        <View key={item.arrival_station} style={styles.row}>
          <Text style={styles.station}>{item.arrival_station}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.departing_count}명</Text>
          </View>
        </View>
      ))}
      <Text style={styles.disclaimer}>
        참고 정보이며, 같은 열차임을 보장하지 않습니다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  station: { fontSize: 16, color: '#333' },
  countBadge: { backgroundColor: '#3182F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  disclaimer: { fontSize: 12, color: '#8B95A1', textAlign: 'center', marginTop: 16 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: '#8B95A1' },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add StationPicker, DirectionPicker, RideStatusCard, DepartureList"
```

---

### Task 6: Routine hook and register page

**Files:**
- Create: `src/hooks/useRoutine.ts`
- Create: `pages/routine/register.tsx`

- [ ] **Step 1: Create useRoutine hook**

Create `src/hooks/useRoutine.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../data/supabase';
import type { Routine, Direction } from '../types';

export function useRoutine(userId: string | null) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function fetch() {
      try {
        const { data } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setRoutine(data);
      } catch {
        setRoutine(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [userId]);

  const createRoutine = useCallback(
    async (params: {
      direction: Direction;
      departure_station: string;
      arrival_station: string;
      departure_time: string;
      days_of_week: number[];
    }) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          line: '2호선',
          ...params,
        })
        .select()
        .single();
      if (error) throw error;
      setRoutine(data);
      return data;
    },
    [userId]
  );

  return { routine, isLoading, createRoutine };
}
```

- [ ] **Step 2: Create register page**

Run: `mkdir -p pages/routine`

Create `pages/routine/register.tsx`:

```tsx
import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { DirectionPicker } from '../../src/components/DirectionPicker';
import { StationPicker } from '../../src/components/StationPicker';
import { getStationNames, getStationsInDirection } from '../../src/data/stations';
import { useAuth } from '../../src/hooks/useAuth';
import { useRoutine } from '../../src/hooks/useRoutine';
import type { Direction } from '../../src/types';

export const Route = createRoute('/routine/register', {
  component: RegisterPage,
});

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

function RegisterPage() {
  const navigation = Route.useNavigation();
  const { userId } = useAuth();
  const { createRoutine } = useRoutine(userId);

  const [direction, setDirection] = useState<Direction | null>(null);
  const [departure, setDeparture] = useState<string | null>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [isSaving, setIsSaving] = useState(false);

  const allStations = getStationNames();
  const arrivalStations = direction && departure
    ? getStationsInDirection(direction, departure)
    : [];

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  };

  const canSave = direction && departure && arrival && selectedDays.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await createRoutine({
        direction,
        departure_station: departure,
        arrival_station: arrival,
        departure_time: `${hour}:${minute}`,
        days_of_week: selectedDays,
      });
      navigation.navigate('/');
    } catch {
      Alert.alert('저장 실패', '다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>출퇴근 루틴 등록</Text>
      <Text style={styles.subtitle}>한 번 등록하면 매일 원탭으로 탑승을 공유할 수 있어요</Text>

      <DirectionPicker selected={direction} onSelect={(d) => { setDirection(d); setDeparture(null); setArrival(null); }} />

      {direction && (
        <StationPicker
          label="출발역"
          stations={allStations}
          selected={departure}
          onSelect={(s) => { setDeparture(s); setArrival(null); }}
        />
      )}

      {departure && (
        <StationPicker
          label="도착역"
          stations={arrivalStations}
          selected={arrival}
          onSelect={setArrival}
        />
      )}

      <Text style={styles.sectionLabel}>탑승 시간</Text>
      <View style={styles.timeRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {HOURS.map((h) => (
            <TouchableOpacity key={h} style={[styles.timeChip, hour === h && styles.timeChipSelected]} onPress={() => setHour(h)}>
              <Text style={[styles.timeText, hour === h && styles.timeTextSelected]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.timeSep}>:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {MINUTES.map((m) => (
            <TouchableOpacity key={m} style={[styles.timeChip, minute === m && styles.timeChipSelected]} onPress={() => setMinute(m)}>
              <Text style={[styles.timeText, minute === m && styles.timeTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionLabel}>반복 요일</Text>
      <View style={styles.daysRow}>
        {DAYS.map((day, idx) => (
          <TouchableOpacity key={day} style={[styles.dayChip, selectedDays.includes(idx) && styles.dayChipSelected]} onPress={() => toggleDay(idx)}>
            <Text style={[styles.dayText, selectedDays.includes(idx) && styles.dayTextSelected]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={handleSave} disabled={!canSave || isSaving}>
        <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '루틴 등록하기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timeScroll: { flex: 1 },
  timeSep: { fontSize: 20, fontWeight: '700', marginHorizontal: 8 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', marginRight: 6 },
  timeChipSelected: { borderColor: '#3182F6', backgroundColor: '#E8F0FE' },
  timeText: { fontSize: 16, color: '#666' },
  timeTextSelected: { color: '#3182F6', fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: 32 },
  dayChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  dayChipSelected: { borderColor: '#3182F6', backgroundColor: '#3182F6' },
  dayText: { fontSize: 14, color: '#666' },
  dayTextSelected: { color: '#FFF', fontWeight: '600' },
  saveBtn: { backgroundColor: '#3182F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#B0B8C1' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRoutine.ts pages/routine/
git commit -m "feat: add useRoutine hook and routine register page"
```

---

### Task 7: ActiveRide hook and ride/active page

**Files:**
- Create: `src/hooks/useActiveRide.ts`
- Create: `pages/ride/active.tsx`

- [ ] **Step 1: Create useActiveRide hook**

Create `src/hooks/useActiveRide.ts`:

```ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../data/supabase';
import { getTravelTimeSeconds, getRemainingStationCount } from '../data/stations';
import { ARRIVING_SOON_SECONDS, RIDE_TTL_MINUTES } from '../constants';
import type { ActiveRide, Direction, RideStatus } from '../types';

export function useActiveRide(userId: string | null) {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    async function fetch() {
      try {
        const { data } = await supabase
          .from('active_rides')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['riding', 'arriving_soon'])
          .order('activated_at', { ascending: false })
          .limit(1)
          .single();
        setRide(data);
      } catch {
        setRide(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [userId]);

  // Auto-transition to arriving_soon
  useEffect(() => {
    if (!ride || ride.status !== 'riding') return;
    const arrivingSoonAt = new Date(ride.estimated_arrival).getTime() - ARRIVING_SOON_SECONDS * 1000;
    const delay = arrivingSoonAt - Date.now();
    if (delay <= 0) {
      updateStatus('arriving_soon');
      return;
    }
    timerRef.current = setTimeout(() => updateStatus('arriving_soon'), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [ride]);

  const startRide = useCallback(
    async (params: {
      direction: Direction;
      departure_station: string;
      arrival_station: string;
    }) => {
      if (!userId) return null;
      const travelSeconds = getTravelTimeSeconds(
        params.direction,
        params.departure_station,
        params.arrival_station
      );
      const now = new Date();
      const estimatedArrival = new Date(now.getTime() + travelSeconds * 1000);
      const expiresAt = new Date(estimatedArrival.getTime() + RIDE_TTL_MINUTES * 60 * 1000);

      const { data, error } = await supabase
        .from('active_rides')
        .insert({
          user_id: userId,
          line: '2호선',
          direction: params.direction,
          departure_station: params.departure_station,
          arrival_station: params.arrival_station,
          status: 'riding',
          estimated_arrival: estimatedArrival.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      setRide(data);
      return data;
    },
    [userId]
  );

  const updateStatus = useCallback(
    async (status: RideStatus) => {
      if (!ride) return;
      const { data, error } = await supabase
        .from('active_rides')
        .update({ status })
        .eq('id', ride.id)
        .select()
        .single();
      if (error) throw error;
      setRide(data);
    },
    [ride]
  );

  const cancelRide = useCallback(async () => {
    if (!ride) return;
    await supabase.from('active_rides').delete().eq('id', ride.id);
    setRide(null);
  }, [ride]);

  const getRemainingInfo = useCallback(() => {
    if (!ride) return { stations: 0, minutes: 0 };
    const now = Date.now();
    const arrival = new Date(ride.estimated_arrival).getTime();
    const remainingMs = Math.max(0, arrival - now);
    return {
      stations: getRemainingStationCount(ride.direction as Direction, ride.departure_station, ride.arrival_station),
      minutes: Math.ceil(remainingMs / 60000),
    };
  }, [ride]);

  return { ride, isLoading, startRide, updateStatus, cancelRide, getRemainingInfo };
}
```

- [ ] **Step 2: Create ride/active page**

Run: `mkdir -p pages/ride`

Create `pages/ride/active.tsx`:

```tsx
import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RideStatusCard } from '../../src/components/RideStatusCard';
import { useAuth } from '../../src/hooks/useAuth';
import { useActiveRide } from '../../src/hooks/useActiveRide';

export const Route = createRoute('/ride/active', {
  component: ActiveRidePage,
});

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
        <TouchableOpacity
          style={styles.arriveBtn}
          onPress={async () => {
            await updateStatus('arrived');
            navigation.navigate('/');
          }}
        >
          <Text style={styles.arriveBtnText}>지금 내려요</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={async () => {
            await cancelRide();
            navigation.navigate('/');
          }}
        >
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
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useActiveRide.ts pages/ride/
git commit -m "feat: add useActiveRide hook and ride/active page"
```

---

### Task 8: Realtime seats hook and seat finder page

**Files:**
- Create: `src/hooks/useRealtimeSeats.ts`
- Create: `pages/seat/finder.tsx`

- [ ] **Step 1: Create useRealtimeSeats hook**

Create `src/hooks/useRealtimeSeats.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../data/supabase';
import type { Direction, DepartureCount } from '../types';
import { getStationsInDirection } from '../data/stations';

export function useRealtimeSeats(
  line: string,
  direction: Direction | null,
  currentStation: string | null
) {
  const [departures, setDepartures] = useState<DepartureCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartures = useCallback(async () => {
    if (!direction || !currentStation) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('active_rides')
        .select('arrival_station')
        .eq('line', line)
        .eq('direction', direction)
        .in('status', ['riding', 'arriving_soon'])
        .gt('expires_at', new Date().toISOString());

      if (!data) { setDepartures([]); return; }

      const upcomingStations = getStationsInDirection(direction, currentStation);
      const counts = new Map<string, number>();
      for (const row of data) {
        if (upcomingStations.includes(row.arrival_station)) {
          counts.set(row.arrival_station, (counts.get(row.arrival_station) ?? 0) + 1);
        }
      }

      const result: DepartureCount[] = upcomingStations
        .filter((s) => counts.has(s))
        .map((s) => ({ arrival_station: s, departing_count: counts.get(s)! }));
      setDepartures(result);
    } catch {
      setDepartures([]);
    } finally {
      setIsLoading(false);
    }
  }, [line, direction, currentStation]);

  useEffect(() => {
    fetchDepartures();
  }, [fetchDepartures]);

  // Realtime subscription
  useEffect(() => {
    if (!direction) return;
    const channel = supabase
      .channel('active-rides-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_rides', filter: `line=eq.${line}` },
        () => { fetchDepartures(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [line, direction, fetchDepartures]);

  return { departures, isLoading, refresh: fetchDepartures };
}
```

- [ ] **Step 2: Create seat finder page**

Run: `mkdir -p pages/seat`

Create `pages/seat/finder.tsx`:

```tsx
import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { DirectionPicker } from '../../src/components/DirectionPicker';
import { StationPicker } from '../../src/components/StationPicker';
import { DepartureList } from '../../src/components/DepartureList';
import { getStationNames } from '../../src/data/stations';
import { supabase } from '../../src/data/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useRealtimeSeats } from '../../src/hooks/useRealtimeSeats';
import { LINE_NAME } from '../../src/constants';
import type { Direction } from '../../src/types';

export const Route = createRoute('/seat/finder', {
  component: SeatFinderPage,
});

function SeatFinderPage() {
  const { userId } = useAuth();
  const [direction, setDirection] = useState<Direction | null>(null);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const { departures, isLoading } = useRealtimeSeats(LINE_NAME, direction, currentStation);

  const handleSeatReport = async () => {
    if (!userId || !currentStation) return;
    try {
      await supabase.from('seat_reports').insert({
        user_id: userId,
        line: LINE_NAME,
        station: currentStation,
      });
      Alert.alert('기록 완료', '자리 확보가 기록되었어요!');
    } catch {
      // 실패해도 앱 차단하지 않음
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>빈 자리 확인</Text>
      <Text style={styles.subtitle}>곧 내릴 사람이 있는 역을 확인해보세요</Text>

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
          {isLoading ? (
            <Text style={styles.loading}>불러오는 중...</Text>
          ) : (
            <DepartureList departures={departures} currentStation={currentStation} />
          )}

          {departures.length > 0 && (
            <TouchableOpacity style={styles.seatBtn} onPress={handleSeatReport}>
              <Text style={styles.seatBtnText}>앉았어요!</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B95A1', marginBottom: 24 },
  loading: { fontSize: 14, color: '#8B95A1', textAlign: 'center', marginTop: 20 },
  seatBtn: { backgroundColor: '#00C853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  seatBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRealtimeSeats.ts pages/seat/
git commit -m "feat: add useRealtimeSeats hook and seat finder page"
```

---

### Task 9: Main dashboard (index.tsx)

**Files:**
- Modify: `pages/index.tsx`

- [ ] **Step 1: Rewrite index.tsx as main dashboard**

Replace `pages/index.tsx` with:

```tsx
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { useRoutine } from '../src/hooks/useRoutine';
import { useActiveRide } from '../src/hooks/useActiveRide';
import { RideStatusCard } from '../src/components/RideStatusCard';
import { getRemainingStationCount } from '../src/data/stations';
import type { Direction } from '../src/types';

export const Route = createRoute('/', {
  component: DashboardPage,
});

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

  // 탑승 중이면 상태 카드 표시
  if (ride && ride.status !== 'arrived') {
    const remaining = getRemainingInfo();
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Subway</Text>
        <RideStatusCard
          status={ride.status as 'riding' | 'arriving_soon'}
          arrivalStation={ride.arrival_station}
          remainingStations={remaining.stations}
          remainingMinutes={remaining.minutes}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('/ride/active')}>
          <Text style={styles.primaryBtnText}>탑승 상세 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('/seat/finder')}>
          <Text style={styles.secondaryBtnText}>빈 자리 확인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 루틴 미등록
  if (!routine) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Subway</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>나도 앉고 싶어요!</Text>
          <Text style={styles.cardDesc}>출퇴근 루틴을 등록하면 빈 자리 정보를 공유할 수 있어요</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('/routine/register')}>
            <Text style={styles.primaryBtnText}>루틴 등록하기</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('/seat/finder')}>
          <Text style={styles.secondaryBtnText}>빈 자리 확인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 루틴 등록됨 — 탑승 확인 유도
  const isRoutineTime = checkRoutineTime(routine.departure_time);

  const handleStartRide = async () => {
    try {
      await startRide({
        direction: routine.direction as Direction,
        departure_station: routine.departure_station,
        arrival_station: routine.arrival_station,
      });
      navigation.navigate('/ride/active');
    } catch {
      // 에러 시 앱 차단하지 않음
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subway</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>내 루틴</Text>
        <Text style={styles.routeText}>
          {routine.departure_station} → {routine.arrival_station}
        </Text>
        <Text style={styles.dirText}>{routine.direction} · {routine.departure_time}</Text>
      </View>

      {isRoutineTime && (
        <TouchableOpacity style={styles.rideBtn} onPress={handleStartRide}>
          <Text style={styles.rideBtnText}>지금 탑승 중이에요!</Text>
        </TouchableOpacity>
      )}

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
  secondaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#8B95A1' },
  rideBtn: { backgroundColor: '#00C853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  rideBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#8B95A1', marginTop: 4 },
});
```

- [ ] **Step 2: Remove about.tsx (no longer needed)**

Run: `rm pages/about.tsx`

- [ ] **Step 3: Commit**

```bash
git add pages/index.tsx
git rm pages/about.tsx
git commit -m "feat: implement main dashboard with ride activation and routing"
```

---

### Task 10: Final wiring and cleanup

**Files:**
- Modify: `pages/_app.tsx` (no changes needed, already wired)
- Modify: `require.context.ts` (no changes needed)

- [ ] **Step 1: Verify _app.tsx is correct**

Read `pages/_app.tsx` and confirm it has `AppsInToss.registerApp` with `{ context }`.
No changes needed if it matches the scaffold.

- [ ] **Step 2: Push all changes to remote**

```bash
git push origin main
```

- [ ] **Step 3: Run Supabase schema**

Open Supabase Dashboard > SQL Editor and run the contents of `supabase/schema.sql`.
Enable Realtime for `active_rides` in Dashboard > Database > Replication.

- [ ] **Step 4: Test locally**

Run: `npm run dev`
Open in sandbox app with `intoss://subway`.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Types, constants, deps | `src/types/`, `src/constants/` |
| 2 | Station data + utils | `src/data/line2.json`, `src/data/stations.ts` |
| 3 | Supabase client + schema | `src/data/supabase.ts`, `supabase/schema.sql` |
| 4 | Auth hook | `src/hooks/useAuth.ts` |
| 5 | UI Components (4) | `src/components/*.tsx` |
| 6 | Routine hook + page | `src/hooks/useRoutine.ts`, `pages/routine/register.tsx` |
| 7 | ActiveRide hook + page | `src/hooks/useActiveRide.ts`, `pages/ride/active.tsx` |
| 8 | Realtime hook + finder | `src/hooks/useRealtimeSeats.ts`, `pages/seat/finder.tsx` |
| 9 | Main dashboard | `pages/index.tsx` |
| 10 | Final wiring + deploy | Push + Supabase schema |
