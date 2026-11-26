import { chunkDocuments } from "@/lib/chunk";
import { MIN_SCORE, rankChunks } from "@/lib/search";
import { buildSystemPrompt, getMode, streamCompletion } from "@/lib/llm";
import { buildDemoAnswer, streamText } from "@/lib/demo";
import { isRateLimited } from "@/lib/rateLimit";
import type { ChatMessage, ChatRequestBody, KbDocument, Settings, Source } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOCS_CHARS = 400_000;
const MAX_MESSAGE_CHARS = 2_000;
const HISTORY_LIMIT = 8;

function json(status: number, error: string) {
  return Response.json({ error }, { status });
}

function isMessage(m: unknown): m is ChatMessage {
  const x = m as ChatMessage;
  return !!x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string";
}

function isDoc(d: unknown): d is KbDocument {
  const x = d as KbDocument;
  return !!x && typeof x.id === "string" && typeof x.title === "string" && typeof x.content === "string";
}

function sanitizeSettings(s: Partial<Settings> | undefined): Settings {
  const tone = s?.tone === "professional" || s?.tone === "concise" ? s.tone : "friendly";
  return {
    businessName: String(s?.businessName || "our company").slice(0, 80),
    assistantName: String(s?.assistantName || "Support Assistant").slice(0, 60),
    welcomeMessage: "",
    tone,
    brandColor: "",
    suggestedQuestions: [],
  };
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(ip)) return json(429, "Too many messages. Please wait a minute and try again.");

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return json(400, "Invalid JSON body.");
  }

  const messages = Array.isArray(body.messages) ? body.messages.filter(isMessage) : [];
  const documents = Array.isArray(body.documents) ? body.documents.filter(isDoc) : [];
  const settings = sanitizeSettings(body.settings);

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) return json(400, "The last message must be from the user.");
  if (last.content.length > MAX_MESSAGE_CHARS) return json(413, "Message is too long.");
  const docsSize = documents.reduce((s, d) => s + d.content.length, 0);
  if (docsSize > MAX_DOCS_CHARS) return json(413, "Knowledge base is too large for this demo (400k characters max).");

  // Search with the current question. Only for vague follow-ups ("how much is it?")
  // do we add the previous question, so unrelated new questions don't inherit old context.
  const chunks = chunkDocuments(documents);
  const relevant = (q: string) => rankChunks(q, chunks, 4).filter((c) => c.score >= MIN_SCORE);
  let context = relevant(last.content);
  const prevUser = messages.slice(0, -1).reverse().find((m) => m.role === "user");
  const isFollowUp = /\b(it|that|this|those|these|them|they|one|there)\b/i.test(last.content);
  if (context.length === 0 && prevUser && isFollowUp) {
    context = relevant(`${prevUser.content} ${last.content}`);
  }

  const sources: Source[] = context.map((c) => ({
    docId: c.docId,
    title: c.title,
    excerpt: c.text.replace(/^#{1,6}\s+/gm, "").slice(0, 160),
    score: Math.round(c.score * 100) / 100,
  }));

  const mode = getMode();
  let stream: ReadableStream<Uint8Array>;

  try {
    if (mode === "demo") {
      stream = streamText(buildDemoAnswer(last.content, context, settings));
    } else {
      const history = messages.slice(-HISTORY_LIMIT).map((m) => ({
        role: m.role,
        content: m.content.slice(0, MAX_MESSAGE_CHARS),
      }));
      // Anthropic requires the conversation to start with a user turn.
      while (history.length && history[0].role !== "user") history.shift();
      stream = await streamCompletion(mode, buildSystemPrompt(settings, context), history, req.signal);
    }
  } catch (err) {
    console.error("[chat] provider error:", err);
    return json(502, "The AI provider is not responding right now. Please try again.");
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Mode": mode,
      "X-Sources": encodeURIComponent(JSON.stringify(sources)),
    },
  });
}
