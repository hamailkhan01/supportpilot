"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Markdown } from "./Markdown";
import { HANDOFF_MARKER, OPEN_CHAT_EVENT } from "@/lib/constants";
import { uid, useDocs, useLeads, useSettings } from "@/lib/store";
import type { ChatMessage, Mode, Source } from "@/lib/types";

type UiMessage = ChatMessage & {
  id: string;
  sources?: Source[];
  streaming?: boolean;
  error?: boolean;
  handoff?: "offered" | "done";
};

const MODE_LABEL: Record<Mode, string> = {
  anthropic: "AI · Claude",
  openai: "AI · OpenAI",
  demo: "Demo mode",
};

function visible(text: string): string {
  // Hide the handoff marker, including a half-streamed one at the very end.
  return text.replace(HANDOFF_MARKER, "").replace(/\[\[[A-Z]*\]?$/, "").trimEnd();
}

export function ChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [docs] = useDocs();
  const [settings] = useSettings();
  const [, setLeads] = useLeads();

  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [openSources, setOpenSources] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<UiMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { mode: Mode }) => setMode(d.mode))
      .catch(() => setMode(null));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const patch = (id: string, changes: Partial<UiMessage>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const userMsg: UiMessage = { id: uid(), role: "user", content: question };
      const replyId = uid();
      const history: ChatMessage[] = [...messagesRef.current.filter((m) => !m.error && m.content), userMsg].map(
        (m) => ({ role: m.role, content: visible(m.content) }),
      );

      setMessages((prev) => [...prev, userMsg, { id: replyId, role: "assistant", content: "", streaming: true }]);
      setInput("");
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let acc = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, documents: docs, settings }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || "Something went wrong. Please try again.");
        }

        const headerMode = res.headers.get("X-Mode") as Mode | null;
        if (headerMode) setMode(headerMode);
        let sources: Source[] = [];
        try {
          sources = JSON.parse(decodeURIComponent(res.headers.get("X-Sources") || "%5B%5D")) as Source[];
        } catch {
          sources = [];
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          patch(replyId, { content: acc });
        }

        const needsHuman = acc.includes(HANDOFF_MARKER);
        patch(replyId, {
          content: visible(acc).trim() || "Sorry, I couldn't produce an answer. Please try rephrasing.",
          streaming: false,
          sources: needsHuman ? [] : sources,
          handoff: needsHuman ? "offered" : undefined,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          patch(replyId, { content: visible(acc) || "_Stopped._", streaming: false });
        } else {
          patch(replyId, { content: (err as Error).message, streaming: false, error: true });
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, docs, settings],
  );

  // Let buttons elsewhere on the page open the widget and ask a question.
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<string | undefined>).detail;
      if (q) void send(q);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, [send]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const submitLead = (msgId: string, form: HTMLFormElement) => {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return;
    const idx = messagesRef.current.findIndex((m) => m.id === msgId);
    const question =
      [...messagesRef.current.slice(0, idx)].reverse().find((m) => m.role === "user")?.content ?? "";
    setLeads((prev) => [{ id: uid(), name, email, question, createdAt: Date.now() }, ...prev]);
    patch(msgId, { handoff: "done" });
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content: `Thanks ${name}! I've passed your question to the ${settings.businessName} team. They'll reply to **${email}** soon.`,
      },
    ]);
  };

  const brand = { "--brand": settings.brandColor || "#4f46e5" } as CSSProperties;
  const empty = messages.length === 0;

  return (
    <div style={brand} className="text-[15px]">
      {open && (
        <div
          role="dialog"
          aria-label={`${settings.businessName} support chat`}
          className="fixed inset-x-3 bottom-24 z-50 flex h-[min(620px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:inset-x-auto sm:right-6 sm:w-[390px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-[var(--brand)] px-4 py-3 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 font-semibold">
              {settings.assistantName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">{settings.assistantName}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {settings.businessName} support{mode ? ` · ${MODE_LABEL[mode]}` : ""}
              </p>
            </div>
            {!empty && (
              <button
                onClick={() => {
                  abortRef.current?.abort();
                  setMessages([]);
                }}
                className="rounded-md px-2 py-1 text-xs text-white/85 hover:bg-white/15"
                title="Start a new conversation"
              >
                New chat
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-8 w-8 place-items-center rounded-md text-xl leading-none hover:bg-white/15"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            <Bubble role="assistant">
              <Markdown text={settings.welcomeMessage} />
            </Bubble>

            {empty && settings.suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {settings.suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => void send(q)}
                    className="rounded-full border border-[var(--brand)]/30 bg-white px-3 py-1.5 text-left text-sm text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <Bubble role={m.role} error={m.error}>
                  {m.role === "assistant" && m.streaming && !m.content ? (
                    <TypingDots />
                  ) : m.role === "assistant" ? (
                    <Markdown text={visible(m.content)} />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </Bubble>

                {m.sources && m.sources.length > 0 && (
                  <div className="pl-1">
                    <button
                      onClick={() => setOpenSources(openSources === m.id ? null : m.id)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      {openSources === m.id ? "Hide" : "Show"} sources ({m.sources.length})
                    </button>
                    {openSources === m.id && (
                      <ul className="mt-1.5 space-y-1.5">
                        {m.sources.map((s, i) => (
                          <li key={i} className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{s.title}</span>
                            <span className="ml-1 text-slate-400">· relevance {s.score}</span>
                            <p className="mt-0.5 line-clamp-2">{s.excerpt}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {m.handoff === "offered" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitLead(m.id, e.currentTarget);
                    }}
                    className="ml-1 space-y-2 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <p className="text-sm font-medium text-slate-800">Talk to a human</p>
                    <input
                      name="name"
                      required
                      placeholder="Your name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                    />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                    />
                    <button className="w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-medium text-white hover:opacity-90">
                      Send to support team
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>

          {/* Composer */}
          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Type your question…"
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="h-[42px] rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-[42px] rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                Send
              </button>
            )}
          </form>
          <p className="bg-white pb-2 text-center text-[11px] text-slate-400">
            AI answers come from {settings.businessName}&apos;s help docs and can be wrong.
          </p>
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[var(--brand)] text-white shadow-lg shadow-slate-900/25 transition hover:scale-105"
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

function Bubble({ role, error, children }: { role: ChatMessage["role"]; error?: boolean; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[var(--brand)] text-white"
            : error
              ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
