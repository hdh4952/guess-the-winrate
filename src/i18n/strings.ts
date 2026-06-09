export type Lang = "ko" | "en";

export const LANG_KEY = "gtw-lang";

const ko = {
  // App / RatingPicker
  pickRating: "레이팅 구간을 선택하세요",
  // ScoreBar
  streak: "현재 연속",
  best: "최고 기록",
  // GameScreen top bar + question
  home: "← 처음으로",
  ratingLabel: (label: string) => `레이팅 ${label}`,
  emptyBucket: "이 레이팅 구간은 데이터가 부족해요.",
  pickAnotherRange: "다른 구간 선택",
  questionBefore: "어느 쪽이 ",
  questionAfter: " 승률이 더 높을까요?",
  white: "백",
  black: "흑",
  draw: "무",
  next: "다음 문제",
  // OpeningCarousel
  openingAria: (n: number) => `오프닝 ${n}/2`,
  // OpeningCard
  firstPosition: "처음 포지션",
  prevMove: "이전 수",
  nextMove: "다음 수",
  ply: (ply: number, total: number) => `수 ${ply}/${total}`,
  pickThis: "이 오프닝 선택",
  // ResultBars
  winRateLabel: (side: string) => `${side} 승률`,
  games: (n: number) => `(${n.toLocaleString()}판)`,
  // ResultComparePanel
  correct: "정답",
  myPick: "내 선택",
  // UpdateToast (PWA)
  updateAvailable: "새 버전이 있어요",
  refresh: "새로고침",
  // InstallButton / IosInstallModal
  installApp: "앱 설치",
  iosInstallTitle: "홈 화면에 추가",
  iosInstallStep1: "하단 공유 버튼을 누르세요",
  iosInstallStep2: "'홈 화면에 추가'를 선택하세요",
  close: "닫기",
};

export type Strings = typeof ko;

const en: Strings = {
  pickRating: "Pick a rating range",
  streak: "Streak",
  best: "Best",
  home: "← Home",
  ratingLabel: (label: string) => `Rating ${label}`,
  emptyBucket: "Not enough data for this rating range.",
  pickAnotherRange: "Pick another range",
  questionBefore: "Which side has a higher ",
  questionAfter: " win rate?",
  white: "White",
  black: "Black",
  draw: "Draw",
  next: "Next",
  openingAria: (n: number) => `Opening ${n}/2`,
  firstPosition: "First position",
  prevMove: "Previous move",
  nextMove: "Next move",
  ply: (ply: number, total: number) => `Move ${ply}/${total}`,
  pickThis: "Pick this opening",
  winRateLabel: (side: string) => `${side} win rate`,
  games: (n: number) => `(${n.toLocaleString()} games)`,
  correct: "Correct",
  myPick: "My pick",
  updateAvailable: "A new version is available",
  refresh: "Refresh",
  installApp: "Install app",
  iosInstallTitle: "Add to Home Screen",
  iosInstallStep1: "Tap the Share button below",
  iosInstallStep2: "Choose 'Add to Home Screen'",
  close: "Close",
};

export const strings: Record<Lang, Strings> = { ko, en };

/** Saved choice wins; otherwise Korean browsers get `ko`, everyone else `en`. */
export function detectLang(nav: { language?: string } = navigator): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ko" || saved === "en") return saved;
  } catch {
    /* localStorage unavailable (private mode) — fall through to navigator */
  }
  return nav.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}
