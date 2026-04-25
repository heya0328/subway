# Mozy

서울 지하철 2호선 빈자리 실시간 공유 미니앱 (Apps-in-Toss).

호스트 토스 앱 안에서 동작하는 Granite + React Native 0.84 기반 미니앱으로,
공유–신청–매칭 사이클(빈자리 공유)과 루틴–탑승추적–도착예측을 두 축으로 합니다.

---

## 기술 스택

| 레이어 | 사용 기술 |
| --- | --- |
| 프레임워크 | [Granite](https://developers-apps-in-toss.toss.im) (RN 0.84, file-based routing) |
| 호스트 SDK | `@apps-in-toss/framework` 2.x |
| UI | `@toss/tds-react-native` (TDS) + 자체 컴포넌트 |
| 데이터 | Supabase (Postgres + Realtime) |
| 외부 API | 서울 열린데이터광장 — 지하철 실시간 도착 |

---

## 처음 셋업하기 (다른 노트북에서 클론할 때)

### 1. 사전 요구사항

| 도구 | 버전 | 비고 |
| --- | --- | --- |
| **Node** | **22.x** | RN 0.84 + Granite은 Node 22에서 안정. 시스템 기본 Node가 24면 충돌 가능 |
| **npm** | Node 22 번들 | yarn/pnpm은 미검증 |
| **Watchman** | 최신 | `brew install watchman`. 미설치 시 EMFILE 에러 |
| **Xcode** | 최신 | iOS 시뮬레이터 (iOS 16+) 필요 |
| **macOS** | — | (Android 셋업은 미문서화) |

```sh
# Node 22 설치 (Homebrew)
brew install node@22

# Watchman 설치
brew install watchman
```

### 2. 클론 + 의존성 설치

```sh
git clone https://github.com/heya0328/subway.git
cd subway
/opt/homebrew/opt/node@22/bin/npm install
```

`postinstall`이 자동으로 `@granite-js/mpack`의 `useWatchman: false` 핫픽스를
적용합니다 (`scripts/patch-watchman.js` 참고). 별도 작업 불필요.

### 3. 환경변수

**현재 외부 키는 모두 코드에 하드코딩되어 있고 모두 publishable/공공 키라
별도의 `.env` 없이 클론 직후 바로 동작합니다.** 향후 env-ize를 위해
[`.env.example`](.env.example)을 참고만 두세요.

| 키 | 위치 | 비고 |
| --- | --- | --- |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | [src/data/supabase.ts](src/data/supabase.ts) | publishable anon key (RLS 적용 전제) |
| `SEOUL_METRO_API_KEY` | [src/data/seoulMetroApi.ts](src/data/seoulMetroApi.ts) | 공공데이터, 본인 키로 바꿔도 무방 |

### 4. 앱인토스 샌드박스 앱 설치

미니앱은 Toss 앱 또는 **앱인토스 샌드박스 앱** 안에서만 동작합니다.

1. iOS 시뮬레이터 실행: `open -a Simulator`
2. iOS 16+ 디바이스 부팅 (예: iPhone 17 Pro)
3. 샌드박스 앱(.app) 다운로드:
   - https://developers-apps-in-toss.toss.im/development/test/sandbox
   - 시뮬레이터용은 `iOS` 행, 실기기는 `iOS(실기기)` 행
4. 다운받은 `AppsInTossSandbox.app`을 시뮬레이터 화면으로 **드래그 앤 드롭**
   또는 CLI:
   ```sh
   xcrun simctl install booted /path/to/AppsInTossSandbox.app
   ```
5. 앱 실행 → 토스 비즈니스 계정으로 로그인 → 워크스페이스에서 `mozy` 선택

> RN 0.84을 쓰므로 **2026-03 이후 빌드된 최신 샌드박스 앱**이 필요합니다.

### 5. 개발 서버 + 실행

```sh
# Metro 개발 서버 (포트 8081)
/opt/homebrew/opt/node@22/bin/npm run dev
```

번들이 빌드되면:

1. 시뮬레이터의 샌드박스 앱에서 `intoss://mozy` 입력 → "스키마 열기"
2. 또는 CLI로 한 번에:
   ```sh
   xcrun simctl openurl booted "intoss://mozy"
   ```
3. 화면 상단에 `Loading from Metro...` 후 mozy 화면이 떠야 정상

---

## 디렉터리 구조

```
.
├── pages/                      # Granite file-based routing
│   ├── _404.tsx
│   ├── index.tsx               # / — 메인 (셋업 + 피드 + 탭바)
│   ├── feed/index.tsx          # /feed → / 리다이렉트
│   ├── ride/active.tsx         # /ride/active — 탑승 현황
│   ├── routine/register.tsx    # /routine/register — 루틴 등록
│   └── seat/
│       ├── detail.tsx          # /seat/detail — 자리 상세 + 신청
│       └── finder.tsx          # /seat/finder — 빈자리 검색
├── src/
│   ├── _app.tsx                # Granite.registerApp 진입점
│   ├── components/             # 프레젠테이션 컴포넌트
│   ├── hooks/                  # SDK 래핑 + 상태 훅
│   ├── data/                   # 데이터 페칭 (supabase / seoulMetroApi / stations)
│   ├── types/                  # 공유 타입
│   └── constants/              # 상수
├── supabase/schema.sql         # DB 스키마
├── scripts/patch-watchman.js   # postinstall 자동 패치
├── patch-fs.js                 # graceful-fs 폴리필 (granite dev에서 require)
├── granite.config.ts           # appName, scheme, plugins
├── babel.config.js
├── react-native.config.js
├── require.context.ts          # pages/ require.context
└── index.ts                    # register(App)
```

---

## 구현된 기능

### 메인 화면 ([pages/index.tsx](pages/index.tsx))

- **셋업 플로우**: 외선/내선 → 출발역 → 도착역 → 본인 칸 (1~10)
- **메인 피드**:
  - 빈자리 공유 카드 리스트 (사용자 칸 기준 거리순 정렬)
  - 추천 칸 헤드라인 (가장 많은 공유가 있는 칸)
  - 실시간 열차 도착 정보 카드
  - FAB "+ 내 자리 공유"
- **하단 탭**: 🏠 홈 / 💺 내 자리 / 🎫 신청 현황
- 등록된 루틴 있으면 자동 적용

### 빈자리 공유 / 신청

- **공유**: [ShareForm.tsx](src/components/ShareForm.tsx) — 하차역, 분(1·3·5·10·15·20), 메모, 차량 입력
- **카드**: [SeatShareCard.tsx](src/components/SeatShareCard.tsx) — n칸 이동(열차 방향/반대) 텍스트
- **상세 + 신청**: [pages/seat/detail.tsx](pages/seat/detail.tsx) — 중복 신청 방지, pending/matched/rejected
- **내 자리**: [MySeatView.tsx](src/components/MySeatView.tsx) — 내가 공유한 자리 + 신청자 수 + 좌석 위치 입력
- **신청 현황**: [MyClaimsView.tsx](src/components/MyClaimsView.tsx) — 내가 신청한 자리 + 진행 상태 + 남은 역

### 탑승 추적 ([pages/ride/active.tsx](pages/ride/active.tsx))

- 상태 머신: `riding` → `arriving_soon`(3분 전) → `arrived`
- 30초마다 남은 역/분 업데이트
- "지금 내려요" 즉시 도착 처리
- TTL 30분 후 자동 만료

### 루틴 ([pages/routine/register.tsx](pages/routine/register.tsx))

- 방향, 출/도착역, 출발 시각(시:분), 요일(다중)
- 활성 루틴 1건 유지 (`is_active`)
- 메인 화면이 자동 적용

### 빈자리 검색 ([pages/seat/finder.tsx](pages/seat/finder.tsx))

- 방향 + 현재역 기준 이후 하차 예정자 카운트
- Supabase Realtime 구독 (`active_rides` 변경 시 자동 갱신)
- 자리 확보 기록 → `seat_reports`

### 실시간 도착정보

- [seoulMetroApi.ts](src/data/seoulMetroApi.ts) + [useArrivalInfo.ts](src/hooks/useArrivalInfo.ts)
- 서울 공공데이터 API (HTTP, ATS는 샌드박스에서 허용)
- 도착 초 → "곧 도착" / "n분 후" 변환, 최대 4건

### 인증 ([useAuth.ts](src/hooks/useAuth.ts))

- `AppLogin.login()` 우선, 실패/비토스면 `mozy-dev-user` 폴백
- 세션 동안 메모리 캐시

### 데이터 스키마

[supabase/schema.sql](supabase/schema.sql) — `routines`, `active_rides`, `seat_reports`, `seat_claims` (+ `seat_shares`).

---

## 스크립트

| 명령 | 동작 |
| --- | --- |
| `npm run dev` | Granite Metro dev 서버 (port 8081) |
| `npm run build` | 프로덕션 번들 빌드 |
| `npm install` | 의존성 + watchman 패치 자동 적용 |

> 항상 `/opt/homebrew/opt/node@22/bin/npm` 사용 권장 (시스템 Node 24면 깨짐).

---

## 자주 마주치는 문제

### `EMFILE: too many open files` (granite dev 시)

원인: Granite의 metro 설정이 `useWatchman: false`로 하드코딩됨.

해결: `npm install`이 자동으로 `scripts/patch-watchman.js`를 실행해 패치합니다.
수동으로 적용하려면 `node ./scripts/patch-watchman.js`. 그래도 안 되면:

```sh
watchman watch-del-all
rm -rf node_modules
/opt/homebrew/opt/node@22/bin/npm install
```

### 샌드박스 앱이 흰화면

가장 흔한 원인은 **샌드박스 앱 자체가 손상**된 경우. 시뮬레이터에서 앱 삭제 후
[샌드박스 앱 다시 설치](#4-앱인토스-샌드박스-앱-설치)하면 해결됩니다.

번들 자체 문제는 dev 서버 로그(`BUNDLE ./index.ts` 이후 `LOG`/`WARN`/`ERROR`)에서 확인 가능.

### `Unable to lookup in current state: Shutdown`

시뮬레이터가 부팅되지 않은 상태:

```sh
xcrun simctl boot <DEVICE_ID>
# 또는 Simulator.app 자동 부팅
open -a Simulator
```

### 시뮬레이터 화면 캡처 / 딥링크 트리거

```sh
# 부팅된 시뮬레이터에서 mozy 진입
xcrun simctl openurl booted "intoss://mozy"

# 스크린샷
xcrun simctl io booted screenshot /tmp/sim.png
```

---

## 코딩 규칙

이 레포의 [CLAUDE.md](CLAUDE.md)에 상세 가이드가 있습니다. 핵심만:

- **TDS 컴포넌트 우선**, 외부 UI 라이브러리 금지
- SDK 호출은 `isSupported()` → `try-catch` → 폴백 3단계
- 모든 이벤트 리스너는 `useEffect` cleanup에서 해제
- `AsyncStorage` 금지 (whiteout 이슈) → SDK `Storage` 사용
- 한 파일 = 한 책임, SDK 래핑은 커스텀 훅으로

---

## 참고 링크

- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im)
- [TDS React Native](https://toss-react-native.toss.im)
- [샌드박스 앱 다운로드](https://developers-apps-in-toss.toss.im/development/test/sandbox)
- [개발 서버 연결 가이드](https://developers-apps-in-toss.toss.im/development/local-server)
