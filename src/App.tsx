import { useState } from "react";
import openingsData from "./data/openings.json";
import type { OpeningEntry } from "./types";
import { RatingPicker } from "./components/RatingPicker";
import { GameScreen } from "./components/GameScreen";
import "./styles.css";

const openings = openingsData as OpeningEntry[];
const BEST_KEY = "gtw-best-streak";

export default function App() {
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
      <h1 className="title">Guess the Winrate</h1>
      {bucket === null ? (
        <RatingPicker onSelect={setBucket} />
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
    </main>
  );
}
