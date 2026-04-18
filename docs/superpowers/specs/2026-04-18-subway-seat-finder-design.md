# Subway Seat Finder — MVP Spec

## Overview

지하철 2호선에서 "곧 내릴 사람"을 크라우드소싱으로 공유하는 앱인토스 RN 미니앱.
사용자가 출퇴근 루틴을 등록하면, 탑승 시 원탭으로 하차 예고가 공유되고,
서 있는 사용자는 역별 하차 예정 인원을 실시간으로 확인한다.

## Tech Stack

- **Frontend:** React Native (Granite 기반 앱인토스 미니앱)
- **UI:** @toss/tds-react-native (TDS 컴포넌트 필수)
- **Backend:** Supabase (PostgreSQL + Realtime + Auth)
- **Auth:** 토스 로그인 연동 (앱인토스 SDK) → Supabase JWT
- **Data:** 2호선 역 데이터 하드코딩 (역명, 순서, 역간 소요시간)

## Pages (Granite file-based routing)

```
pages/
├── _app.tsx                # AppsInToss.registerApp entry
├── index.tsx               # 메인 대시보드
├── routine/
│   └── register.tsx        # 루틴 등록
├── ride/
│   └── active.tsx          # 탑승 중 화면
└── seat/
    └── finder.tsx          # 빈 자리 뷰
```

### index.tsx — 메인 대시보드
- 로그인 상태 확인 → 미로그인 시 토스 로그인 유도
- 루틴 미등록 → "루틴 등록하기" CTA 표시, `/routine/register`로 이동
- 루틴 등록됨 + 루틴 시간대 → "지금 탑승 중이세요?" 모달 표시 → 확인 시 ActiveRide 생성, `/ride/active`로 이동
- 루틴 등록됨 + 루틴 시간 외 → 루틴 정보 표시 + "빈 자리 확인" 버튼 (→ `/seat/finder`)
- 하단: "빈 자리 확인하기" 버튼 (항상 노출)

### routine/register.tsx — 루틴 등록
- Step 1: 노선 선택 (MVP: 2호선 고정)
- Step 2: 방향 선택 (외선순환 / 내선순환)
- Step 3: 출발역 선택 (StationPicker)
- Step 4: 도착역 선택 (StationPicker, 출발역 이후 역만 표시)
- Step 5: 탑승 시간 (HH:MM picker)
- Step 6: 반복 요일 (월~일 다중 선택)
- 저장 → Supabase routines INSERT → index로 이동

### ride/active.tsx — 탑승 중
- 현재 상태 카드: "탑승 중" or "곧 내려요" (도착 3분 전 자동 전환)
- 남은 역 수 + 예상 도착 시간 표시
- "지금 내려요" 수동 하차 버튼 → ActiveRide status를 "arrived"로 업데이트
- "오늘은 안 타요" → ActiveRide 삭제, index로 이동
- 도착 시간 계산: departure_station → arrival_station 역간 소요시간 합산 (line2.json)

### seat/finder.tsx — 빈 자리 뷰
- 노선 (2호선 고정) + 방향 선택 + 현재역 선택
- 최근 검색 이력 또는 루틴 기반 자동 채움
- 현재역 이후 각 역별 "N명 하차 예정" 리스트 (Supabase Realtime 구독)
- 0건이면: "아직 이 노선에 탑승 공유 중인 사용자가 없어요. 먼저 루틴을 등록해보세요!"
- "앉았어요!" 자기 보고 버튼 → seat_reports INSERT
- 하단 안내: "표시 정보는 참고용이며, 같은 열차임을 보장하지 않습니다"

## Source Structure

```
src/
├── components/
│   ├── StationPicker.tsx       # 역 선택 (TDS Select 기반)
│   ├── DirectionPicker.tsx     # 외선/내선 선택 (TDS SegmentedControl)
│   ├── RideStatusCard.tsx      # 탑승 상태 카드
│   └── DepartureList.tsx       # 역별 하차 예정 인원 리스트
├── hooks/
│   ├── useAuth.ts              # 토스 로그인 → Supabase JWT
│   ├── useRoutine.ts           # 루틴 CRUD
│   ├── useActiveRide.ts        # 탑승 상태 관리
│   └── useRealtimeSeats.ts     # Realtime 구독
├── data/
│   ├── supabase.ts             # Supabase 클라이언트
│   ├── stations.ts             # 역 데이터 유틸 함수
│   └── line2.json              # 2호선 역 목록 + 역간 소요시간(초)
├── types/
│   └── index.ts                # 공유 타입
└── constants/
    └── index.ts                # TTL, 도착 임박 기준 등
```

## Data Model (Supabase)

### routines

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | text | 토스 user ID |
| line | text | "2호선" |
| direction | text | "외선순환" or "내선순환" |
| departure_station | text | 출발역명 |
| arrival_station | text | 도착역명 |
| departure_time | time | HH:MM |
| days_of_week | int[] | {0,1,2,3,4} = 월~금 |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS: 자기 user_id만 SELECT/INSERT/UPDATE/DELETE.

### active_rides

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | |
| line | text | |
| direction | text | |
| departure_station | text | |
| arrival_station | text | |
| status | text | "riding", "arriving_soon", "arrived" |
| activated_at | timestamptz | default now() |
| estimated_arrival | timestamptz | 계산: activated_at + 역간 소요시간 합 |
| expires_at | timestamptz | estimated_arrival + 30분 |

RLS: INSERT/UPDATE/DELETE는 자기 user_id만. SELECT는 같은 line+direction이면 누구나.
Index: (line, direction, status, expires_at).
Realtime: 이 테이블에 Supabase Realtime 활성화, 클라이언트는 line+direction으로 필터 구독.

### seat_reports

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | |
| line | text | |
| station | text | 자리를 확보한 역 |
| created_at | timestamptz | |

RLS: INSERT는 누구나, SELECT는 분석용 (서비스 화면에서는 미사용).

### TTL 정리

Supabase pg_cron으로 10분마다 실행:
```sql
DELETE FROM active_rides WHERE expires_at < NOW();
```

## Key Query (빈 자리 뷰)

```sql
SELECT arrival_station, COUNT(*) as departing_count
FROM active_rides
WHERE line = $line
  AND direction = $direction
  AND status IN ('riding', 'arriving_soon')
  AND expires_at > NOW()
GROUP BY arrival_station;
```

클라이언트에서는 Supabase Realtime 구독으로 변경사항을 실시간 반영.

## 2호선 역 데이터 (line2.json)

하드코딩. 형식:
```json
{
  "line": "2호선",
  "stations": [
    { "name": "시청", "order": 0, "seconds_to_next": 120 },
    { "name": "을지로입구", "order": 1, "seconds_to_next": 90 },
    ...
  ]
}
```

순환선이므로 마지막 역 → 첫 역으로 순환.
외선순환: order 오름차순. 내선순환: order 내림차순.
역간 소요시간은 서울교통공사 시간표 기준 평균값 사용.

## Auth Flow

1. 앱 진입 → 앱인토스 SDK `AppLogin.isSupported()` 체크
2. 지원 시 → `AppLogin.login()` → 토스 accessToken 획득
3. accessToken → Supabase Edge Function → JWT 교환 → Supabase Auth 세션 생성
4. 비토스 환경 → 로그인 건너뛰기, 기능 제한 안내

## 도착 시간 계산

```
estimated_arrival = activated_at + sum(seconds_to_next from departure to arrival)
arriving_soon_at = estimated_arrival - 180초 (3분 전)
```

- 정상 운행 기준 고정값 사용
- 지연/급행 시 오차 가능 → UI에 "참고 정보" 명시
- arriving_soon 시점에 status 자동 업데이트 (클라이언트 타이머)

## Error Handling (CLAUDE.md 규칙)

모든 SDK/외부 호출은 3단계 패턴:
```tsx
if (API.isSupported?.()) {
  try {
    await API(options);
  } catch { /* 폴백 */ }
}
```

- Supabase 연결 실패 → "일시적으로 서비스를 이용할 수 없어요" 안내, 앱 차단 안 함
- 로그인 실패 → 재시도 유도 버튼
- Realtime 끊김 → 자동 재연결, 3회 실패 시 수동 새로고침 유도
- ActiveRide 생성 실패 → 로컬에서 탑승 상태 유지, 재시도

## Constraints

- 앱인토스 RN 미니앱 (백그라운드 실행 불가)
- 푸시 알림 미지원 (MVP) → 앱 진입 시 수동 탑승 확인
- TDS 컴포넌트만 사용 (자체 UI 금지)
- 같은 열차 구분 불가 → "참고 정보" 프레이밍
- 번들 100MB 이하

## Success Metrics

- 루틴 등록 사용자 수 (1주 내 1,000명 목표, 2호선 집중)
- 7일 리텐션 40%+
- "앉았어요!" 자기 보고 비율
- 일일 활성 탑승 공유 수

## Out of Scope (MVP)

- 2호선 외 다른 노선
- 푸시 알림
- 칸 특정 (BLE/NFC)
- 유료화 / 광고
- 공공데이터 API 연동
