import { useState } from "react";
import openingsData from "./data/openings.json";
import type { OpeningEntry } from "./types";
import { RatingPicker } from "./components/RatingPicker";
import { GameScreen } from "./components/GameScreen";
import "./styles.css";
import { LanguageToggle } from "./components/LanguageToggle";
import { UpdateToast } from "./components/UpdateToast";
import { useServiceWorkerUpdate } from "./pwa/useServiceWorkerUpdate";
import { useT } from "./i18n/useT";

const openings = openingsData as unknown as OpeningEntry[];
const BEST_KEY = "gtw-best-streak";

export default function App() {
  const t = useT();
  const { needRefresh, refresh } = useServiceWorkerUpdate();
  const [bucket, setBucket] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState<number>(() => {
    const saved = localStorage.getItem(BEST_KEY);
    return saved ? Number(saved) : 0;
  });

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      const next = streak + 1;
      setStreak(next);
      if (next > best) {
        setBest(next);
        localStorage.setItem(BEST_KEY, String(next));
      }
    } else {
      setStreak(0);
    }
  };

  const handleHome = () => {
    setBucket(null);
    setStreak(0);
  };

  return (
    <main className="app">
      <LanguageToggle />
      <h1 className="title">Guess the Winrate</h1>
      {bucket === null ? (
        <>
          <RatingPicker onSelect={setBucket} />
          <footer className="attribution">
            <a href="https://lichess.org" target="_blank" rel="noopener noreferrer">
              {t.poweredBy}
            </a>
          </footer>
        </>
      ) : (
        <GameScreen
          openings={openings}
          ratingBucket={bucket}
          streak={streak}
          best={best}
          onAnswer={handleAnswer}
          onHome={handleHome}
        />
      )}
      <UpdateToast visible={needRefresh} onRefresh={refresh} />
    </main>
  );
}
