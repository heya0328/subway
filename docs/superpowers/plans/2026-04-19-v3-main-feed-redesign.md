# Mozy V3 — 메인 화면 피드 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 메인 화면을 시안 기반으로 재설계 — 초기 설정(노선/방향/역) 기반으로 칸 선택기 + 빈 자리 피드를 홈에서 바로 보여준다.

**Architecture:** 홈 페이지를 onboarding(초기 설정) → main feed(칸 선택기 + 실시간 피드)로 전환하는 2-state 구조. seat_shares 테이블에 car_number 컬럼 추가.

**Tech Stack:** React Native (Granite), Supabase Realtime

---

### Task 1: seat_shares 테이블에 car_number 추가

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: SQL 추가**

Append to `supabase/schema.sql`:
```sql
ALTER TABLE seat_shares ADD COLUMN IF NOT EXISTS car_number int NOT NULL DEFAULT 5;
```

- [ ] **Step 2: Supabase Dashboard에서 실행**

- [ ] **Step 3: SeatShare 타입 업데이트**

`src/types/index.ts`의 `SeatShare` 인터페이스에 추가:
```ts
  car_number: number;
```

- [ ] **Step 4: useSeatFeed의 createShare에 car_number 추가**

`src/hooks/useSeatFeed.ts`의 createShare insert에:
```ts
car_number: params.carNumber,
```

params 타입에 `carNumber: number` 추가.

- [ ] **Step 5: Commit**
```bash
git add supabase/schema.sql src/types/index.ts src/hooks/useSeatFeed.ts
git commit -m "feat: add car_number to seat_shares"
```

---

### Task 2: CarSelector 컴포넌트

**Files:**
- Create: `src/components/CarSelector.tsx`

- [ ] **Step 1: 칸 선택기 생성**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  totalCars: number;
  selectedCar: number;
  recommendedCar: number | null;
  onSelect: (car: number) => void;
}

export function CarSelector({ totalCars, selectedCar, recommendedCar, onSelect }: Props) {
  const cars = Array.from({ length: totalCars }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>내 위치</Text>
      <View style={styles.row}>
        {cars.map((num) => {
          const isSelected = num === selectedCar;
          const isRecommended = num === recommendedCar;
          return (
            <TouchableOpacity
              key={num}
              style={[
                styles.car,
                isSelected && styles.carSelected,
                isRecommended && !isSelected && styles.carRecommended,
              ]}
              onPress={() => onSelect(num)}
            >
              <Text style={[
                styles.carText,
                isSelected && styles.carTextSelected,
                isRecommended && !isSelected && styles.carTextRecommended,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.direction}>◀ 열차 진행 방향</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  car: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  carSelected: { backgroundColor: '#191F28' },
  carRecommended: { backgroundColor: '#00C853' },
  carText: { fontSize: 13, fontWeight: '600', color: '#666' },
  carTextSelected: { color: '#FFF' },
  carTextRecommended: { color: '#FFF' },
  direction: { fontSize: 12, color: '#8B95A1', marginTop: 8 },
});
```

- [ ] **Step 2: Commit**
```bash
git add src/components/CarSelector.tsx
git commit -m "feat: add CarSelector component"
```

---

### Task 3: SeatShareCard에 칸 번호 + 거리 표시

**Files:**
- Modify: `src/components/SeatShareCard.tsx`

- [ ] **Step 1: Props에 userCar 추가, 거리 계산**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeatShare } from '../types';

interface Props {
  share: SeatShare;
  userCar: number;
}

export function SeatShareCard({ share, userCar }: Props) {
  const distance = Math.abs(share.car_number - userCar);
  const directionText = share.car_number > userCar ? '열차 방향' : share.car_number < userCar ? '열차 반대 방향' : '같은 칸';
  const distanceText = distance === 0 ? '같은 칸' : `${directionText} ${distance}칸 이동`;

  const createdAt = new Date(share.created_at);
  const agoMinutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  const agoText = agoMinutes === 0 ? '방금' : `${agoMinutes}분 전`;

  return (
    <View style={styles.card}>
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
        <Text style={styles.ago}>{agoText}</Text>
      </View>
    </View>
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
  ago: { fontSize: 12, color: '#B0B8C1', marginTop: 4 },
});
```

- [ ] **Step 2: Commit**
```bash
git add src/components/SeatShareCard.tsx
git commit -m "feat: add car number and distance to SeatShareCard"
```

---

### Task 4: ShareForm에 칸 번호 선택 추가

**Files:**
- Modify: `src/components/ShareForm.tsx`

- [ ] **Step 1: carNumber prop + CarSelector 추가**

ShareForm의 Props에 추가:
```ts
  userCar: number;
```

onSubmit 시그니처 변경:
```ts
onSubmit: (exitStation: string, exitMinutes: number, message: string, carNumber: number) => Promise<void>;
```

carNumber state 추가 (기본값 userCar):
```ts
const [carNumber, setCarNumber] = useState(userCar);
```

CarSelector를 폼 상단에 추가:
```tsx
import { CarSelector } from './CarSelector';
// ...
<CarSelector totalCars={10} selectedCar={carNumber} recommendedCar={null} onSelect={setCarNumber} />
```

handleSubmit에서 carNumber 전달:
```ts
await onSubmit(exitStation, exitMinutes, message, carNumber);
```

- [ ] **Step 2: Commit**
```bash
git add src/components/ShareForm.tsx
git commit -m "feat: add car number selection to ShareForm"
```

---

### Task 5: 홈 페이지 재설계 — 시안 기반

**Files:**
- Rewrite: `pages/index.tsx`

- [ ] **Step 1: 2-state 홈 (설정 → 피드)**

홈 페이지를 완전히 재작성:
- **State 1 (초기 설정)**: 방향 + 출발역 + 도착역 + 칸 번호 입력 → "시작하기"
- **State 2 (메인 피드)**: 상단 경로 요약 + 칸 선택기 + 빈 자리 피드 리스트 + FAB

루틴이 있으면 State 1을 건너뛰고 바로 State 2 표시.
설정값은 모듈 스코프 캐시에 저장.

피드는 useSeatFeed로 실시간 구독, 선택한 칸 기준 거리순 정렬.
가장 빈 자리가 많은 칸을 recommendedCar로 계산해서 CarSelector에 표시.

"+ 내 자리 공유" FAB → ShareForm 모달.

- [ ] **Step 2: Commit**
```bash
git add pages/index.tsx
git commit -m "feat: redesign home as main feed with car selector"
```

---

### Task 6: feed 페이지에서 홈으로 리다이렉트

**Files:**
- Modify: `pages/feed/index.tsx`

- [ ] **Step 1: 피드 페이지를 홈으로 리다이렉트**

기존 피드 페이지는 홈에 통합됐으므로, `/feed` 접근 시 홈으로 이동:
```tsx
function FeedPage() {
  const navigation = Route.useNavigation();
  React.useEffect(() => { navigation.navigate('/'); }, []);
  return null;
}
```

- [ ] **Step 2: Commit**
```bash
git add pages/feed/index.tsx
git commit -m "refactor: redirect /feed to home (feed integrated into home)"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | car_number 컬럼 추가 | schema.sql, types, useSeatFeed |
| 2 | CarSelector 컴포넌트 | src/components/CarSelector.tsx |
| 3 | SeatShareCard 거리 표시 | src/components/SeatShareCard.tsx |
| 4 | ShareForm 칸 선택 | src/components/ShareForm.tsx |
| 5 | 홈 페이지 재설계 | pages/index.tsx |
| 6 | /feed 리다이렉트 | pages/feed/index.tsx |
