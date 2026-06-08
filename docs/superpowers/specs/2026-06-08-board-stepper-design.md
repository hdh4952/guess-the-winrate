# Board stepper + rating display + home button — 설계 문서

작성일: 2026-06-08
프로젝트: Guess the Winrate (증분 기능)

## 개요

세 가지 증분 기능을 추가한다.

1. 각 오프닝 카드의 보드를 좌/우 화살표로 한 수씩 되감기/진행하며 기보를 돌려볼 수 있게 한다.
2. 선택한 레이팅 구간을 게임 화면에 표시한다.
3. 시작(레이팅 선택) 화면으로 돌아가는 "처음으로" 버튼을 둔다.

## 1. 기보 스텝용 포지션 계산

- 새 순수 헬퍼 `src/lib/positions.ts`:
  ```ts
  export function fensForUci(uciMoves: string[]): string[]
  ```
  chess.js로 표준 시작 위치부터 수순을 재생하여 `[시작판, 1수 후, …, 최종]`을 반환한다. 길이 = `uciMoves.length + 1`. 인덱스 0은 표준 시작 FEN.
- **chess.js를 `devDependencies` → `dependencies`로 승격** (런타임 사용). 대안(빌드 시 openings.json에 FEN 배열 저장)은 데이터가 ~2MB 증가하여 채택하지 않는다.

## 2. OpeningCard 구조 변경

- 루트를 `<button>`에서 `<div className="opening-card">`로 변경 (화살표/선택 버튼 중첩 문제 해소).
- 상태: `ply` (기본값 = `uciMoves.length`, 즉 최종 포지션).
- `useMemo`로 `fens = fensForUci(opening.uciMoves)` 계산, `<ChessBoard fen={fens[ply]} />` 렌더.
- 보드 아래 **컨트롤 행**:
  - `←` 버튼: `ply > 0`일 때 활성, 클릭 시 `ply - 1`.
  - `수 {ply}/{uciMoves.length}` 카운터.
  - `→` 버튼: `ply < uciMoves.length`일 때 활성, 클릭 시 `ply + 1`.
- 미공개(`revealed === false`)일 때만 **"이 오프닝 선택"** 버튼 표시 → `onPick`.
- 공개(`revealed === true`) 시 선택 버튼 대신 `ResultBars` 표시. 카드 테두리는 `outcome`("correct"/"wrong")에 따라 색.
- 화살표 스텝은 미공개·공개 모두 가능(탐색/복기용).
- GameScreen에서 각 카드에 `key`(해당 오프닝의 `fen`)를 부여하여 새 라운드마다 리마운트 → `ply`가 최종으로 초기화.

### Props (갱신)
```ts
interface Props {
  opening: OpeningEntry;
  perspective: Perspective;
  revealed: boolean;
  onPick: () => void;
  counts?: Counts;
  outcome?: "correct" | "wrong";
}
```
(기존과 동일; 내부 동작만 변경)

## 3. 레이팅 구간 표시 + 처음으로 버튼

- `src/lib/ratings.ts`에 추가:
  ```ts
  export function bandLabel(bucket: number): string
  ```
  `RATING_BANDS`에서 `bucket`에 해당하는 `label`을 반환(없으면 `String(bucket)`).
- `GameScreen` 상단 바: 왼쪽 **"← 처음으로"** 버튼, 가운데 **"레이팅 {bandLabel}"** 라벨. 그 아래 기존 `ScoreBar`(연속/최고).
- `GameScreen` props에 `onHome: () => void` 추가.
- `App`:
  ```ts
  const handleHome = () => { setBucket(null); setStreak(0); };
  ```
  → `bucket`이 null이 되어 `RatingPicker`로 복귀, 현재 연속 0, 최고 기록(localStorage)은 유지.

## 4. 테스트

- `positions.test.ts`: `fensForUci`
  - 빈 배열 → 길이 1, 인덱스 0 = 표준 시작 FEN.
  - `["e2e4","e7e5"]` → 길이 3, 인덱스 0 시작판, 인덱스 2는 e4/e5 반영.
  - 캡처/프로모션 포함 수순도 예외 없이 처리(길이 = plies+1).
- `ratings.test.ts`에 `bandLabel` 케이스 추가(1600 → "1600-1800", 2500 → "2500+").
- `OpeningCard.test.tsx` 갱신:
  - 미공개 시 "이 오프닝 선택" 버튼 존재, 클릭 시 `onPick` 호출.
  - `←`/`→`로 `수 N/총수` 카운터가 변하고, 최종에서 `→` 비활성·`ply 0`에서 `←` 비활성.
  - 공개 시 `ResultBars`(승률) 표시, 선택 버튼 미표시.
- 마지막: 실제 브라우저로 화살표 스텝·선택·레이팅 표시·처음으로 라이브 검증.

## 영향 파일

- 신규: `src/lib/positions.ts`, `src/lib/positions.test.ts`
- 수정: `src/lib/ratings.ts`(+test), `src/components/OpeningCard.tsx`(+test), `src/components/GameScreen.tsx`, `src/App.tsx`, `src/styles.css`, `package.json`(chess.js 승격)

## 범위 외 (YAGNI)

- SAN 수순 목록에서 현재 수 하이라이트, 자동재생(▶), 키보드 단축키 등은 제외.
