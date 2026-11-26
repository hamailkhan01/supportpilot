import type { KbDocument } from "./types";

export type Chunk = {
  id: string;
  docId: string;
  title: string;
  text: string;
};

const MAX_CHARS = 700;

function splitLongParagraph(p: string): string[] {
  const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [p];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && buf.length + s.length > MAX_CHARS) {
      out.push(buf.trim());
      buf = "";
    }
    buf += s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * Splits a document into paragraph-aware chunks of roughly MAX_CHARS.
 * A markdown heading stays attached to the paragraph that follows it.
 */
export function chunkDocument(doc: KbDocument): Chunk[] {
  const paragraphs = doc.content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => (p.length > MAX_CHARS ? splitLongParagraph(p) : [p]));

  const chunks: Chunk[] = [];
  let buf = "";
  const push = () => {
    if (!buf.trim()) return;
    chunks.push({
      id: `${doc.id}#${chunks.length}`,
      docId: doc.id,
      title: doc.title,
      text: buf.trim(),
    });
    buf = "";
  };

  for (const p of paragraphs) {
    const bufIsOnlyHeading = /^#{1,6}\s/.test(buf) && !buf.includes("\n");
    const startsSection = /^#{1,6}\s/.test(p);
    if (buf && !bufIsOnlyHeading && ((startsSection && buf.length >= 200) || buf.length + p.length + 2 > MAX_CHARS)) push();
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  push();
  return chunks;
}

export function chunkDocuments(docs: KbDocument[]): Chunk[] {
  return docs.flatMap(chunkDocument);
}
