import { useCallback, useEffect, useState } from "react";
import type { OpeningEntry, Round } from "../types";
import { generateRound } from "../lib/round";
import { bandLabel } from "../lib/ratings";
import { isCorrect } from "../lib/winrate";
import { OpeningCard } from "./OpeningCard";
import { ScoreBar } from "./ScoreBar";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { OpeningCarousel } from "./OpeningCarousel";
import { ResultComparePanel } from "./ResultComparePanel";

interface Props {
  openings: OpeningEntry[];
  ratingBucket: number;
  streak: number;
  best: number;
  onAnswer: (correct: boolean) => void;
  onHome: () => void;
}

type Status = "playing" | "revealed" | "empty";

export function GameScreen({ openings, ratingBucket, streak, best, onAnswer, onHome }: Props) {
  const [round, setRound] = useState<Round | null>(null);
  const [status, setStatus] = useState<Status>("playing");
  const [choice, setChoice] = useState<0 | 1 | null>(null);
  const isMobile = useMediaQuery("(max-width: 600px)");

  // Rounds are built from precomputed stats — synchronous, no network.
  const newRound = useCallback(() => {
    setChoice(null);
    try {
      setRound(generateRound(openings, ratingBucket));
      setStatus("playing");
    } catch {
      setRound(null);
      setStatus("empty");
    }
  }, [openings, ratingBucket]);

  useEffect(() => {
    newRound();
  }, [newRound]);

  const pick = (index: 0 | 1) => {
    if (status !== "playing" || !round) return;
    setChoice(index);
    setStatus("revealed");
    onAnswer(isCorrect(index, round.countsA, round.countsB, round.perspective));
  };

  const topBar = (
    <div className="top-bar">
      <button type="button" className="home-button" onClick={onHome}>
        ← 처음으로
      </button>
      <span className="rating-label">레이팅 {bandLabel(ratingBucket)}</span>
    </div>
  );

  if (status === "empty" || !round)
    return (
      <div className="screen game">
        {topBar}
        <div className="center">
          <p>이 레이팅 구간은 데이터가 부족해요.</p>
          <button type="button" onClick={onHome}>다른 구간 선택</button>
        </div>
      </div>
    );

  const correctIndex = isCorrect(0, round.countsA, round.countsB, round.perspective) ? 0 : 1;
  const outcomeFor = (i: 0 | 1): "correct" | "wrong" | undefined => {
    if (status !== "revealed") return undefined;
    if (i === correctIndex) return "correct";
    if (i === choice) return "wrong";
    return undefined;
  };

  return (
    <div className="screen game">
      {topBar}
      <ScoreBar streak={streak} best={best} />
      <h2 className="question">
        어느 쪽이 <strong>{round.perspective === "white" ? "백" : "흑"}</strong> 승률이 더 높을까요?
      </h2>
      {isMobile ? (
        status === "revealed" ? (
          <ResultComparePanel
            a={round.a}
            b={round.b}
            countsA={round.countsA}
            countsB={round.countsB}
            perspective={round.perspective}
            choice={choice}
            onNext={newRound}
          />
        ) : (
          <OpeningCarousel
            a={round.a}
            b={round.b}
            perspective={round.perspective}
            onPick={pick}
          />
        )
      ) : (
        <>
          <div className="cards">
            <OpeningCard
              key={round.a.fen}
              opening={round.a}
              perspective={round.perspective}
              revealed={status === "revealed"}
              onPick={() => pick(0)}
              counts={round.countsA}
              outcome={outcomeFor(0)}
            />
            <OpeningCard
              key={round.b.fen}
              opening={round.b}
              perspective={round.perspective}
              revealed={status === "revealed"}
              onPick={() => pick(1)}
              counts={round.countsB}
              outcome={outcomeFor(1)}
            />
          </div>
          {status === "revealed" ? (
            <button className="next" type="button" onClick={newRound}>다음 문제</button>
          ) : null}
        </>
      )}
    </div>
  );
}
