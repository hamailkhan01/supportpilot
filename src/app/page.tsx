import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ChatWidget } from "@/components/ChatWidget";
import { AskButton } from "@/components/AskButton";
import { SITE } from "@/lib/site";

const SAMPLE_QUESTIONS = [
  "Can I get a refund on a yearly plan?",
  "Do you have a student discount?",
  "How do I connect Slack?",
  "Is my data encrypted?",
];

const STEPS = [
  {
    n: "01",
    title: "Add your docs",
    body: "Paste or upload FAQs, policies and help articles in the dashboard. No training and no database needed.",
  },
  {
    n: "02",
    title: "AI finds the right answer",
    body: "Every question is matched to the most relevant parts of your docs, and only those are sent to the AI model.",
  },
  {
    n: "03",
    title: "Customers get instant help",
    body: "Answers stream in seconds with sources attached. Anything the docs don't cover goes to your team as a lead.",
  },
];

const FEATURES = [
  { title: "Grounded answers", body: "Replies only from your documentation, so the bot won't invent prices or policies." },
  { title: "Source citations", body: "Every answer shows which help article it came from, so customers and your team can check it." },
  { title: "Human handoff", body: "When the docs don't have the answer, the bot says so and collects the customer's name and email." },
  { title: "Claude or OpenAI", body: "Switch AI providers with one environment variable. Demo mode runs with no API key at all." },
  { title: "Live streaming", body: "Replies type out in real time, just like ChatGPT, with a stop button." },
  { title: "Your brand", body: "Set the bot's name, tone, welcome message, colour and suggested questions." },
];

const STACK = ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS 4", "Claude API", "OpenAI API", "BM25 retrieval"];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,70,229,0.14),transparent)]" />
          <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 text-center sm:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> AI support agent · live demo
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Turn your help docs into a <span className="text-indigo-600">24/7 support agent</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              {SITE.productName} answers customer questions from your own documentation, cites its sources, and hands
              off to a human when it isn&apos;t sure. Add it to any website.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <AskButton className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500">
                Try the live demo
              </AskButton>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 hover:bg-slate-50"
              >
                Use your own docs
              </Link>
            </div>

            <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white/70 p-5 text-left shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                The demo bot knows the help docs of <span className="text-slate-900">Quillbase</span>, a fictional
                team-notes app. Try asking:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((q) => (
                  <AskButton
                    key={q}
                    question={q}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                  >
                    {q}
                  </AskButton>
                ))}
                <AskButton
                  question="Do you offer a lifetime deal?"
                  className="rounded-full border border-dashed border-amber-300 bg-amber-50 px-3.5 py-1.5 text-sm text-amber-800 hover:bg-amber-100"
                >
                  Something the docs don&apos;t cover →
                </AskButton>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <span className="text-sm font-semibold text-indigo-600">{s.n}</span>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-slate-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center text-3xl font-bold tracking-tight">Built for real support teams</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
              Cuts down repeat tickets without giving customers wrong answers.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 p-6 transition hover:shadow-md">
                  <div className="mb-3 h-9 w-9 rounded-lg bg-indigo-100" />
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stack + CTA */}
        <section className="pb-24">
          <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 px-6 py-14 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Want this on your website?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Your docs, your brand and your AI provider, set up and deployed for your business.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {STACK.map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                  {t}
                </span>
              ))}
            </div>
            <a
              href={SITE.authorUrl}
              className="mt-8 inline-block rounded-xl bg-white px-6 py-3 font-medium text-slate-900 hover:bg-slate-100"
            >
              Contact {SITE.authorName}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        Built by{" "}
        <a href={SITE.authorUrl} className="font-medium text-slate-700 hover:underline">
          {SITE.authorName}
        </a>{" "}
        · Quillbase is a fictional company used for this demo.
      </footer>

      <ChatWidget />
    </>
  );
}
