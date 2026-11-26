"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Nav";
import { ChatWidget } from "@/components/ChatWidget";
import { uid, useDocs, useLeads, useSettings } from "@/lib/store";
import { chunkDocuments } from "@/lib/chunk";
import { MIN_SCORE, rankChunks } from "@/lib/search";
import { DEFAULT_SETTINGS, SAMPLE_DOCS } from "@/lib/sampleData";
import type { KbDocument, Tone } from "@/lib/types";

type Tab = "docs" | "settings" | "test" | "leads";

const TABS: { id: Tab; label: string }[] = [
  { id: "docs", label: "Knowledge base" },
  { id: "settings", label: "Bot settings" },
  { id: "test", label: "Test retrieval" },
  { id: "leads", label: "Leads" },
];

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const btn = "rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-40";
const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-500`;
const secondary = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("docs");
  const [docs, , loaded] = useDocs();
  const [leads] = useLeads();
  const chunkCount = useMemo(() => chunkDocuments(docs).length, [docs]);
  const chars = docs.reduce((s, d) => s + d.content.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Dashboard</span>
          </div>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to demo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Documents" value={loaded ? docs.length : "–"} />
          <Stat label="Searchable chunks" value={loaded ? chunkCount : "–"} />
          <Stat label="Characters" value={loaded ? chars.toLocaleString() : "–"} />
          <Stat label="Leads captured" value={loaded ? leads.length : "–"} />
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "docs" && <DocsPanel />}
          {tab === "settings" && <SettingsPanel />}
          {tab === "test" && <TestPanel />}
          {tab === "leads" && <LeadsPanel />}
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ---------------- Knowledge base ---------------- */

function DocsPanel() {
  const [docs, setDocs] = useDocs();
  const [editing, setEditing] = useState<KbDocument | null>(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const startNew = () => setEditing({ id: uid(), title: "", content: "", updatedAt: Date.now() });

  const save = () => {
    if (!editing || !editing.title.trim() || !editing.content.trim()) return;
    const doc = { ...editing, title: editing.title.trim(), updatedAt: Date.now() };
    setDocs((prev) => (prev.some((d) => d.id === doc.id) ? prev.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...prev]));
    setEditing(null);
    flash("Saved. The bot uses it right away.");
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this document from the knowledge base?")) return;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: KbDocument[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 300_000) {
        flash(`${f.name} is larger than 300 KB, skipped.`);
        continue;
      }
      const content = (await f.text()).trim();
      if (content) added.push({ id: uid(), title: f.name.replace(/\.[^.]+$/, ""), content, updatedAt: Date.now() });
    }
    if (added.length) {
      setDocs((prev) => [...added, ...prev]);
      flash(`Added ${added.length} document${added.length > 1 ? "s" : ""}.`);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card
        title="Documents"
        actions={
          <div className="flex gap-2">
            <button className={secondary} onClick={() => fileRef.current?.click()}>
              Upload
            </button>
            <button className={primary} onClick={startNew}>
              + New
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".txt,.md,.markdown,.csv,.json,.html"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files)}
            />
          </div>
        }
      >
        {notice && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
        {docs.length === 0 ? (
          <p className="text-sm text-slate-500">No documents yet. Add one, or load the sample docs.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <button onClick={() => setEditing(d)} className="min-w-0 text-left">
                  <p className={`truncate text-sm font-medium ${editing?.id === d.id ? "text-indigo-700" : "text-slate-800"}`}>
                    {d.title}
                  </p>
                  <p className="text-xs text-slate-500">{d.content.length.toLocaleString()} characters</p>
                </button>
                <button onClick={() => remove(d.id)} className="text-xs text-slate-400 hover:text-red-600">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <button
            className={secondary}
            onClick={() => {
              if (window.confirm("Replace all documents with the Quillbase sample docs?")) setDocs(SAMPLE_DOCS);
            }}
          >
            Load sample docs
          </button>
          <button
            className={secondary}
            onClick={() => {
              if (window.confirm("Remove every document?")) setDocs([]);
            }}
          >
            Clear all
          </button>
        </div>
      </Card>

      <Card title={editing ? (docs.some((d) => d.id === editing.id) ? "Edit document" : "New document") : "Editor"}>
        {editing ? (
          <div className="space-y-3">
            <input
              className={input}
              placeholder="Title, e.g. Refund policy"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <textarea
              className={`${input} min-h-[360px] font-mono text-[13px]`}
              placeholder={"Paste help-article text here. Markdown headings (## ...) help split it into sections."}
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button className={secondary} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={primary} onClick={save} disabled={!editing.title.trim() || !editing.content.trim()}>
                Save document
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Pick a document to edit, or click <b>+ New</b>. You can upload .txt, .md, .csv, .json or .html files.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsPanel() {
  const [settings, setSettings] = useSettings();
  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <Card
      title="Bot settings"
      actions={
        <button className={secondary} onClick={() => setSettings(DEFAULT_SETTINGS)}>
          Reset to defaults
        </button>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Business name">
          <input className={input} value={settings.businessName} onChange={(e) => set("businessName", e.target.value)} />
        </Field>
        <Field label="Assistant name">
          <input className={input} value={settings.assistantName} onChange={(e) => set("assistantName", e.target.value)} />
        </Field>
        <Field label="Tone">
          <select className={input} value={settings.tone} onChange={(e) => set("tone", e.target.value as Tone)}>
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="concise">Concise</option>
          </select>
        </Field>
        <Field label="Brand colour">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.brandColor}
              onChange={(e) => set("brandColor", e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-slate-300"
            />
            <input className={input} value={settings.brandColor} onChange={(e) => set("brandColor", e.target.value)} />
          </div>
        </Field>
        <Field label="Welcome message" wide>
          <textarea
            className={`${input} min-h-[80px]`}
            value={settings.welcomeMessage}
            onChange={(e) => set("welcomeMessage", e.target.value)}
          />
        </Field>
        <Field label="Suggested questions (one per line)" wide>
          <textarea
            className={`${input} min-h-[110px]`}
            value={settings.suggestedQuestions.join("\n")}
            onChange={(e) =>
              set(
                "suggestedQuestions",
                e.target.value.split("\n").map((q) => q.trimStart()).slice(0, 6),
              )
            }
            onBlur={() => set("suggestedQuestions", settings.suggestedQuestions.map((q) => q.trim()).filter(Boolean))}
          />
        </Field>
      </div>
      <p className="mt-5 text-sm text-slate-500">Changes save automatically. Open the chat bubble to see them.</p>
    </Card>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

/* ---------------- Retrieval test ---------------- */

function TestPanel() {
  const [docs] = useDocs();
  const [query, setQuery] = useState("refund yearly plan");
  const chunks = useMemo(() => chunkDocuments(docs), [docs]);
  const results = useMemo(() => rankChunks(query, chunks, 5), [query, chunks]);

  return (
    <Card title="Test retrieval">
      <p className="mb-3 text-sm text-slate-600">
        See exactly which parts of your docs the bot would send to the AI for a question. Chunks scoring at least{" "}
        <b>{MIN_SCORE}</b> are used; lower ones are ignored.
      </p>
      <input className={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a question…" />
      <ul className="mt-4 space-y-3">
        {results.length === 0 && <li className="text-sm text-slate-500">No matching chunks. The bot would offer a human handoff.</li>}
        {results.map((r) => {
          const used = r.score >= MIN_SCORE;
          return (
            <li key={r.id} className={`rounded-xl border p-4 ${used ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 opacity-60"}`}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{r.title}</span>
                <span className={used ? "font-medium text-emerald-700" : "text-slate-500"}>
                  score {r.score.toFixed(2)} · {used ? "used" : "ignored"}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{r.text}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------------- Leads ---------------- */

function LeadsPanel() {
  const [leads, setLeads] = useLeads();

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Email", "Question", "Date"],
      ...leads.map((l) => [l.name, l.email, l.question, new Date(l.createdAt).toISOString()]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "supportpilot-leads.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card
      title="Human handoff leads"
      actions={
        <div className="flex gap-2">
          <button className={secondary} onClick={exportCsv} disabled={!leads.length}>
            Export CSV
          </button>
          <button
            className={secondary}
            disabled={!leads.length}
            onClick={() => {
              if (window.confirm("Delete all leads?")) setLeads([]);
            }}
          >
            Clear
          </button>
        </div>
      }
    >
      {leads.length === 0 ? (
        <p className="text-sm text-slate-500">
          No leads yet. Ask the bot something the docs don&apos;t cover (e.g. &quot;Do you offer a lifetime deal?&quot;) and
          fill in the handoff form.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Question</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{l.name}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{l.email}</td>
                  <td className="max-w-xs py-2.5 pr-4 text-slate-600">{l.question}</td>
                  <td className="whitespace-nowrap py-2.5 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
