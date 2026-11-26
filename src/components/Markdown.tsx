import type { ReactNode } from "react";

// Tiny, safe markdown renderer for chat replies: paragraphs, bullets,
// numbered lists, **bold** and `code`. No raw HTML is ever injected.

function inline(text: string, key: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code key={`${key}-${i}`} className="rounded bg-black/5 px-1 py-0.5 text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
}

type Block = { kind: "p" | "ul" | "ol"; lines: string[] };

export function Markdown({ text }: { text: string }) {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^#{1,6}\s+/, "");
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.kind === "ul") last.lines.push(bullet[1]);
      else blocks.push({ kind: "ul", lines: [bullet[1]] });
    } else if (numbered) {
      if (last?.kind === "ol") last.lines.push(numbered[1]);
      else blocks.push({ kind: "ol", lines: [numbered[1]] });
    } else if (!line.trim()) {
      blocks.push({ kind: "p", lines: [] });
    } else if (last?.kind === "p" && last.lines.length) {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
  }

  return (
    <div className="space-y-2">
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) => {
          if (b.kind === "ul")
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {b.lines.map((l, j) => (
                  <li key={j}>{inline(l, `${i}-${j}`)}</li>
                ))}
              </ul>
            );
          if (b.kind === "ol")
            return (
              <ol key={i} className="list-decimal space-y-1 pl-5">
                {b.lines.map((l, j) => (
                  <li key={j}>{inline(l, `${i}-${j}`)}</li>
                ))}
              </ol>
            );
          return (
            <p key={i}>
              {b.lines.map((l, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {inline(l, `${i}-${j}`)}
                </span>
              ))}
            </p>
          );
        })}
    </div>
  );
}
