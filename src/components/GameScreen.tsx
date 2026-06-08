import { useCallback, useEffect, useRef, useState } from "react";
import type { OpeningEntry, Round } from "../types";
import { generateRound } from "../lib/round";
import { isCorrect } from "../lib/winrate";
import { OpeningCard } from "./OpeningCard";
import { ScoreBar } from "./ScoreBar";

interface Props {
  openings: OpeningEntry[];
  ratingBucket: number;
  streak: number;
  best: number;
  onAnswer: (correct: boolean) => void;
}

type Status = "loading" | "ready" | "revealed" | "error";

export function GameScreen({ openings, ratingBucket, streak, best, onAnswer }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [round, setRound] = useState<Round | null>(null);
  const [choice, setChoice] = useState<0 | 1 | null>(null);

  // Identifies the most recent load. A round fetch that resolves after a newer
  // load started — or after the player has already picked — is stale and must
  // not clobber the current state (e.g. StrictMode's double-invoked mount effect
  // firing two in-flight fetches, the slower one landing after a reveal).
  const requestId = useRef(0);

  const loadRound = useCallback(async () => {
    const id = ++requestId.current;
    setStatus("loading");
    setChoice(null);
    setRound(null);
    try {
      const r = await generateRound(openings, ratingBucket);
      if (id !== requestId.current) return;
      setRound(r);
      setStatus("ready");
    } catch {
      if (id !== requestId.current) return;
      setStatus("error");
    }
  }, [openings, ratingBucket]);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  const pick = (index: 0 | 1) => {
    if (status !== "ready" || !round) return;
    requestId.current++; // invalidate any in-flight load so it can't overwrite the reveal
    setChoice(index);
    setStatus("revealed");
    onAnswer(isCorrect(index, round.countsA, round.countsB, round.perspective));
  };

  if (status === "loading") return <div className="screen center">불러오는 중…</div>;
  if (status === "error")
    return (
      <div className="screen center">
        <p>문제를 불러오지 못했어요.</p>
        <button type="button" onClick={loadRound}>다시 시도</button>
      </div>
    );
  if (!round) return null;

  const correctIndex = isCorrect(0, round.countsA, round.countsB, round.perspective) ? 0 : 1;
  const outcomeFor = (i: 0 | 1): "correct" | "wrong" | undefined => {
    if (status !== "revealed") return undefined;
    if (i === correctIndex) return "correct";
    if (i === choice) return "wrong";
    return undefined;
  };

  return (
    <div className="screen game">
      <ScoreBar streak={streak} best={best} />
      <h2 className="question">
        어느 쪽이 <strong>{round.perspective === "white" ? "백" : "흑"}</strong> 승률이 더 높을까요?
      </h2>
      <div className="cards">
        <OpeningCard
          opening={round.a}
          perspective={round.perspective}
          revealed={status === "revealed"}
          onPick={() => pick(0)}
          counts={round.countsA}
          outcome={outcomeFor(0)}
        />
        <OpeningCard
          opening={round.b}
          perspective={round.perspective}
          revealed={status === "revealed"}
          onPick={() => pick(1)}
          counts={round.countsB}
          outcome={outcomeFor(1)}
        />
      </div>
      {status === "revealed" ? (
        <button className="next" type="button" onClick={loadRound}>다음 문제</button>
      ) : null}
    </div>
  );
}
