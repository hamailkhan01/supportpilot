import "server-only";
import type { Settings } from "./types";
import type { RankedChunk } from "./search";
import { HANDOFF_MARKER } from "./constants";

const GREETING = /^\s*(hi|hello|hey|salam|assalam|good (morning|afternoon|evening)|yo)\b[\s!.?]*$/i;

function cleanExcerpt(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^#{1,6}\s/.test(l.trim()))
    .join("\n")
    .trim();
}

/**
 * Builds an answer without any AI provider, straight from the best-matching
 * documentation. Lets the app run (and be demoed) with zero API cost.
 */
export function buildDemoAnswer(question: string, context: RankedChunk[], settings: Settings): string {
  if (GREETING.test(question)) {
    return `Hi! I'm ${settings.assistantName}. Ask me anything about ${settings.businessName}.`;
  }
  if (context.length === 0) {
    return `I couldn't find that in the ${settings.businessName} help docs. I can connect you with our support team so a person can help. ${HANDOFF_MARKER}`;
  }
  const best = cleanExcerpt(context[0].text);
  return `Here's what the **${context[0].title}** guide says:\n\n${best}`;
}

/** Streams text word by word so demo mode feels like a live model. */
export function streamText(text: string, delayMs = 12): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const parts = text.split(/(\s+)/);
  let i = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (i >= parts.length) {
        controller.close();
        return;
      }
      const slice = parts.slice(i, i + 3).join("");
      i += 3;
      controller.enqueue(encoder.encode(slice));
      await new Promise((r) => setTimeout(r, delayMs));
    },
  });
}
