# Mozy V2 — UX 개선 + 실시간 피드 + 공공 API

## Overview

3가지 개선: (1) 역 검색 UX, (2) 서울교통공사 공공 API 실시간 도착/혼잡도, (3) 실시간 좌석 공유 피드.

## Feature 1: SearchableStationPicker

기존 `StationPicker`를 검색 가능한 버전으로 교체.

**동작:**
- TextInput에 역명 입력 → 실시간 필터링 ("강" → 강남, 강변)
- 빈 입력 시 전체 역 표시
- 상단에 최근 선택 역 최대 3개 표시 (모듈 스코프 캐시)
- 선택 시 콜백 호출 + 최근 선택 목록 업데이트

**파일:**
- Modify: `src/components/StationPicker.tsx` → 검색 기능 추가
- 사용처: `pages/routine/register.tsx`, `pages/seat/finder.tsx`, `pages/feed/index.tsx`

**인터페이스 (변경 없음):**
```tsx
interface Props {
  label: string;
  stations: string[];
  selected: string | null;
  onSelect: (station: string) => void;
}
```

## Feature 2: 공공 API 실시간 도착 + 혼잡도

서울교통공사 Open API로 실시간 열차 도착 정보와 혼잡도를 제공.

**API:**
- 실시간 도착: `http://swopenapi.seoul.go.kr/api/subway/{KEY}/json/realtimeStationArrival/0/5/{역명}`
- 응답: 다음 열차 도착까지 남은 시간, 방향, 열차 상태

**파일:**
- Create: `src/data/seoulMetroApi.ts` — API 호출 래퍼
- Create: `src/hooks/useArrivalInfo.ts` — 역 선택 시 실시간 도착 정보 fetch + 30초 간격 갱신
- Create: `src/components/ArrivalInfo.tsx` — "다음 열차 2분 후 도착 · 혼잡도: 보통" 카드

**사용처:** `pages/seat/finder.tsx`에서 역 선택 후 표시, `pages/feed/index.tsx`에서도 표시

**에러 처리:** API 실패 시 컴포넌트 숨김 (앱 차단 안 함). API 키는 `.env`에 `SEOUL_METRO_API_KEY` 저장.

## Feature 3: 실시간 좌석 공유 피드

앉아있는 사용자가 "나 곧 내려요"를 실시간으로 공유하는 피드.

**Supabase 테이블: `seat_shares`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | |
| line | text | "2호선" |
| direction | text | |
| current_station | text | 현재 탑승 중인 역 근처 |
| exit_station | text | 하차 예정 역 |
| exit_minutes | int | 약 N분 후 하차 |
| message | text | 선택 — "창가 자리예요" 등 |
| created_at | timestamptz | |
| expires_at | timestamptz | created_at + exit_minutes + 5분 |

RLS: 비활성화 (MVP). Realtime 활성화. TTL: pg_cron으로 만료 레코드 삭제.

**파일:**
- Create: `src/hooks/useSeatFeed.ts` — 피드 CRUD + Supabase Realtime 구독
- Create: `src/components/SeatShareCard.tsx` — 피드 카드 UI
- Create: `src/components/ShareForm.tsx` — "나도 내려요" 입력 폼 (하차역 + 메시지)
- Create: `pages/feed/index.tsx` — 피드 페이지

**플로우:**
1. 홈에서 "실시간 피드" 버튼 → `/feed` 이동
2. 노선/방향/현재역 선택 (SearchableStationPicker)
3. 해당 구간의 실시간 피드 카드 표시 (Supabase Realtime)
4. "나도 내려요" 버튼 → 하차역 선택 + 선택적 메시지 → seat_shares INSERT
5. 피드 카드: "{exit_station}에서 하차 예정 ({exit_minutes}분 후) — {message}"
6. 만료 시간 지나면 자동 삭제

**홈 대시보드 수정:** "실시간 피드" 버튼 추가 (`pages/index.tsx`)

## 수정 대상 기존 파일

- `pages/index.tsx` — "실시간 피드" 버튼 추가
- `pages/seat/finder.tsx` — ArrivalInfo 컴포넌트 추가
- `src/components/StationPicker.tsx` — 검색 기능으로 리팩토링
- `supabase/schema.sql` — seat_shares 테이블 추가
- `.env` — SEOUL_METRO_API_KEY 추가

## Out of Scope

- 노선도 시각화 UI
- 2호선 외 노선
- 채팅/댓글 기능
- 사용자 프로필/닉네임
