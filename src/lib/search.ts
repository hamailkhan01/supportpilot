import type { Chunk } from "./chunk";

const STOPWORDS = new Set(
  (
    "a an the and or but if then so of to in on at by for with about from into over under " +
    "is are was were be been being am do does did done have has had having i me my we our you your " +
    "he she it its they them their this that these those there here what which who whom how why when where " +
    "can could would should will shall may might must just also very too not no yes please thanks thank " +
    "hi hello hey any some all more most such own same than up down out off again further once only " +
    "get got want need like know tell let make"
  ).split(/\s+/),
);

function stem(word: string): string {
  let w = word;
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith("ll")) w = w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

// Small synonym map so everyday wording still matches the docs.
const SYNONYMS: Record<string, string[]> = {
  cost: ["pric"],
  much: ["pric"],
  expensiv: ["pric"],
  fee: ["pric"],
  charg: ["pric", "bill"],
  money: ["refund"],
  login: ["password", "sign"],
  log: ["sign"],
  safe: ["security", "encrypt"],
  secur: ["security", "encrypt"],
  discount: ["discount", "free"],
  cancel: ["cancel", "downgrad"],
};

function expandQuery(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) for (const s of SYNONYMS[t] ?? []) out.add(s);
  return Array.from(out);
}

export type RankedChunk = Chunk & { score: number };

/** Minimum BM25 score for a chunk to count as relevant. */
export const MIN_SCORE = 1.2;

/**
 * BM25 keyword ranking. Runs locally, needs no embeddings API and costs nothing,
 * which keeps the app cheap to run and easy to deploy.
 */
export function rankChunks(query: string, chunks: Chunk[], topK = 4): RankedChunk[] {
  const qTokens = expandQuery(Array.from(new Set(tokenize(query))));
  if (qTokens.length === 0 || chunks.length === 0) return [];

  const k1 = 1.5;
  const b = 0.75;
  const docs = chunks.map((c) => tokenize(`${c.title} ${c.text}`));
  const N = docs.length;
  const avgdl = docs.reduce((s, d) => s + d.length, 0) / N || 1;

  const df = new Map<string, number>();
  for (const d of docs) {
    for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const ranked: RankedChunk[] = chunks.map((chunk, i) => {
    const d = docs[i];
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const q of qTokens) {
      const f = tf.get(q);
      if (!f) continue;
      const n = df.get(q) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avgdl)));
    }
    return { ...chunk, score };
  });

  return ranked
    .filter((r) => r.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, topK);
}
