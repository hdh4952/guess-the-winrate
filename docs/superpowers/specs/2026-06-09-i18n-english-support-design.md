# 영어 지원 추가 (KO/EN i18n) — 설계 문서

날짜: 2026-06-09
상태: 승인됨 (사용자 확인 완료)

## 목표

현재 한국어로만 하드코딩된 UI 문자열을 한국어/영어 두 언어로 제공한다.
브라우저 언어로 초기 언어를 자동 감지하고, 사용자가 우측 상단 토글로 직접 전환할 수 있게 한다.

## 결정 사항

- **언어 선택 방식**: 수동 토글 + 자동 감지
  - 초기값: `navigator.language`가 `ko`로 시작하면 `ko`, 아니면 `en`
  - `localStorage`(`gtw-lang`)에 저장된 사용자 선택이 있으면 그 값 우선
- **구현 방식**: 외부 라이브러리 없이 가벼운 자체 구현 (문자열 수가 적음)
- **토글 위치**: 앱 우측 상단 고정(`position: fixed`), `KO | EN`

## 구조

신설 디렉터리 `src/i18n/`:

- `strings.ts`
  - `ko`, `en` 두 언어의 번역 사전을 동일한 키 형태로 정의
  - 정적 문자열은 string, 보간 필요 항목은 함수로 정의
  - 예: `ply: (ply: number, total: number) => string`, `games: (n: number) => string`
  - `Strings` 타입을 `ko` 사전에서 추론하여 `en`이 같은 키를 강제로 갖도록 함(키 누락 컴파일 에러)
- `LanguageContext.tsx`
  - `Lang = "ko" | "en"`
  - `LanguageProvider`: 초기 언어 감지 + localStorage 동기화, `{ lang, setLang }` 제공
  - `setLang` 호출 시 state 갱신 + `localStorage.setItem("gtw-lang", lang)`
- `useT.ts`
  - `useT()` → 현재 `lang`에 해당하는 `strings[lang]` 사전 반환
  - 컴포넌트에서 `const t = useT(); t.title`, `t.ply(ply, total)` 형태로 사용
- `LanguageToggle.tsx`
  - `useLanguage()`로 `lang`/`setLang` 구독, `KO | EN` 토글 렌더
  - 우측 상단 고정 배치 (스타일은 `styles.css`에 추가)

## 데이터 흐름

`main.tsx`에서 `<LanguageProvider>`로 `<App>`을 감싼다.
→ 각 컴포넌트가 `useT()`로 현재 언어 문자열을 구독
→ `<LanguageToggle>`은 `App` 최상단에 렌더
→ 토글 변경 시 Context 값이 바뀌어 하위 트리 전체 리렌더

## 적용 대상 (하드코딩된 한국어 → t() 교체)

| 파일 | 문자열 예시 |
|------|------------|
| `RatingPicker.tsx` | "레이팅 구간을 선택하세요" |
| `ScoreBar.tsx` | "현재 연속", "최고 기록" |
| `GameScreen.tsx` | "← 처음으로", "레이팅 {label}", "이 레이팅 구간은 데이터가 부족해요.", "다른 구간 선택", "어느 쪽이 {백/흑} 승률이 더 높을까요?", "다음 문제" |
| `OpeningCarousel.tsx` | `aria-label` "오프닝 {i}/2" |
| `OpeningCard.tsx` | aria-label "처음 포지션"/"이전 수"/"다음 수", "수 {ply}/{total}", "이 오프닝 선택" |
| `ResultBars.tsx` | "백/무/흑 {pct}%", "{백/흑} 승률", "({total}판)" |
| `ResultComparePanel.tsx` | "정답", "내 선택", "다음 문제" |

## 게임 용어 매핑 (ko → en)

- 백 → White, 흑 → Black, 무 → Draw
- 판 → games (예: `(12,345판)` → `(12,345 games)`)
- 수 → move (예: `수 3/8` → `Move 3/8`)
- 정답 → Correct, 내 선택 → My pick
- 다음 문제 → Next, 처음으로 → Home, 다른 구간 선택 → Pick another range
- 현재 연속 → Streak, 최고 기록 → Best
- 레이팅 → Rating

## 에러 처리 / 엣지 케이스

- `localStorage` 접근 실패(프라이빗 모드 등) 시 try/catch로 감싸 감지값으로 폴백
- 저장된 값이 `ko`/`en`이 아니면 무시하고 감지값 사용
- SSR 아님(Vite SPA)이므로 `navigator`/`localStorage` 직접 접근 안전

## 테스트

- **i18n 단위 테스트**: `strings.ts` 키 일치(타입으로 보장되지만 보간 함수 동작 확인), 언어 감지 로직(`ko-KR`→ko, `en-US`→en), localStorage 우선순위
- **기존 컴포넌트 테스트**: 현재 한국어 문자열을 직접 단언하는 테스트들은 `LanguageProvider`로 감싸고 기본 `ko`를 강제하여 깨지지 않게 유지. 필요한 곳은 테스트 헬퍼(`renderWithLang`)로 래핑
- **토글 테스트**: `LanguageToggle` 클릭 시 문자열이 영어로 바뀌는지, localStorage에 저장되는지

## 범위 밖 (YAGNI)

- 3개 이상 언어 확장 구조 (현재 2개만)
- 데이터(`openings.json`)의 오프닝 이름 번역 — 체스 표준 명칭이므로 그대로 유지
- 날짜/숫자 로케일 포매팅 라이브러리 (기존 `toLocaleString` 유지)
