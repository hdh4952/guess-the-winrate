/**
 * Builds src/data/openings.json from the Lichess opening dictionary TSVs.
 * Keeps only openings with >= 6 plies and precomputes SAN, UCI and final FEN.
 * Run with: npm run build:openings
 */
import { Chess } from "chess.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface OpeningEntry {
  eco: string;
  name: string;
  sanMoves: string[];
  uciMoves: string[];
  fen: string;
}

const FILES = ["a", "b", "c", "d", "e"];
const BASE =
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master";
const MIN_PLIES = 6;

async function fetchTsv(letter: string): Promise<string> {
  const res = await fetch(`${BASE}/${letter}.tsv`);
  if (!res.ok) throw new Error(`Failed to fetch ${letter}.tsv: ${res.status}`);
  return res.text();
}

function parseRow(line: string): OpeningEntry | null {
  const [eco, name, pgn] = line.split("\t");
  if (!eco || !name || !pgn) return null;
  const chess = new Chess();
  chess.loadPgn(pgn);
  const verbose = chess.history({ verbose: true });
  if (verbose.length < MIN_PLIES) return null;
  const sanMoves = chess.history();
  const uciMoves = verbose.map((m) => m.from + m.to + (m.promotion ?? ""));
  return { eco, name, sanMoves, uciMoves, fen: chess.fen() };
}

async function main() {
  const entries: OpeningEntry[] = [];
  for (const letter of FILES) {
    const tsv = await fetchTsv(letter);
    const lines = tsv.split("\n").slice(1); // drop header
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = parseRow(line);
        if (entry) entries.push(entry);
      } catch {
        // skip malformed rows
      }
    }
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(here, "../src/data/openings.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(entries));
  console.log(`Wrote ${entries.length} openings to ${outPath}`);
}

main();
