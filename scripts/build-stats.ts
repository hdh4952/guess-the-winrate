/**
 * Enriches src/data/openings.json with per-rating-band W/D/L counts from the
 * Lichess Opening Explorer, so the app runs with NO runtime API calls.
 *
 * A band's counts are kept only when total games >= MIN_GAMES; openings with no
 * qualifying band are dropped. Resumable via a gitignored cache file, so the
 * (long) run can be stopped and restarted without re-fetching.
 *
 * Run with: npm run build:stats   (needs VITE_LICHESS_TOKEN in .env)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BUCKETS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];
const MIN_GAMES = 300;
const BASE = "https://explorer.lichess.ovh/lichess";
const CONCURRENCY = 3;
const CALL_DELAY_MS = 50;

const here = dirname(fileURLToPath(import.meta.url));
const openingsPath = resolve(here, "../src/data/openings.json");
const cachePath = resolve(here, "./.stats-cache.json");

type Triple = [number, number, number];

interface BaseOpening {
  eco: string;
  name: string;
  sanMoves: string[];
  uciMoves: string[];
  fen: string;
}

function loadToken(): string {
  const envPath = resolve(here, "../.env");
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, "utf8").match(/VITE_LICHESS_TOKEN=(.+)/);
    if (m && m[1].trim()) return m[1].trim();
  }
  return process.env.VITE_LICHESS_TOKEN ?? "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchBand(token: string, uci: string, bucket: number): Promise<Triple> {
  const url = `${BASE}?variant=standard&play=${uci}&speeds=blitz,rapid,classical&ratings=${bucket}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) {
      console.log("  429 rate-limited, backing off 60s…");
      await sleep(60000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${uci} @${bucket}`);
    const d = (await res.json()) as { white: number; draws: number; black: number };
    return [d.white, d.draws, d.black];
  }
  throw new Error(`repeatedly rate-limited for ${uci} @${bucket}`);
}

async function main() {
  const token = loadToken();
  if (!token) throw new Error("VITE_LICHESS_TOKEN missing (.env or environment)");

  const openings: BaseOpening[] = JSON.parse(readFileSync(openingsPath, "utf8"));
  const cache: Record<string, Record<string, Triple>> = existsSync(cachePath)
    ? JSON.parse(readFileSync(cachePath, "utf8"))
    : {};

  const total = openings.length;
  let done = 0;
  let next = 0;

  async function worker() {
    while (next < openings.length) {
      const o = openings[next++];
      const key = o.uciMoves.join(",");
      if (!cache[key]) {
        const bandCounts: Record<string, Triple> = {};
        for (const b of BUCKETS) {
          bandCounts[String(b)] = await fetchBand(token, key, b);
          await sleep(CALL_DELAY_MS);
        }
        cache[key] = bandCounts;
      }
      done++;
      if (done % 25 === 0) {
        writeFileSync(cachePath, JSON.stringify(cache));
        console.log(`  ${done}/${total} openings fetched`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeFileSync(cachePath, JSON.stringify(cache));

  // Assemble final data: keep only bands with >= MIN_GAMES; drop empty openings.
  const enriched = openings
    .map((o) => {
      const raw = cache[o.uciMoves.join(",")] ?? {};
      const counts: Record<string, Triple> = {};
      for (const [b, c] of Object.entries(raw)) {
        if (c[0] + c[1] + c[2] >= MIN_GAMES) counts[b] = c;
      }
      return { ...o, counts };
    })
    .filter((o) => Object.keys(o.counts).length > 0);

  writeFileSync(openingsPath, JSON.stringify(enriched));
  console.log(
    `Wrote ${enriched.length}/${total} openings with stats ` +
      `(dropped ${total - enriched.length} with no band >= ${MIN_GAMES}).`
  );
}

main();
