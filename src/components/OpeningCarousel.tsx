import { useRef, useState } from "react";
import type { OpeningEntry, Perspective } from "../types";
import { OpeningCard } from "./OpeningCard";
import { useT } from "../i18n/useT";

interface Props {
  a: OpeningEntry;
  b: OpeningEntry;
  perspective: Perspective;
  onPick: (index: 0 | 1) => void;
}

const SWIPE_THRESHOLD = 40;

/** Mobile play view: one opening at a time, switched by swipe or the 1/2 buttons. */
export function OpeningCarousel({ a, b, perspective, onPick }: Props) {
  const t = useT();
  const [active, setActive] = useState<0 | 1>(0);
  const startX = useRef(0);
  const openings = [a, b] as const;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // Two slides only: swipe left -> second opening, right -> first (absolute, not toggle).
    setActive(dx < 0 ? 1 : 0);
  };

  return (
    <div className="carousel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="switcher" role="tablist">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-label={t.openingAria(i + 1)}
            aria-selected={active === i}
            className={"switch-btn" + (active === i ? " active" : "")}
            onClick={() => setActive(i as 0 | 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {/* key on fen remounts OpeningCard on switch, resetting its move-stepper to the final position. */}
      <OpeningCard
        key={openings[active].fen}
        opening={openings[active]}
        perspective={perspective}
        revealed={false}
        onPick={() => onPick(active)}
        fillHeight
      />
    </div>
  );
}
