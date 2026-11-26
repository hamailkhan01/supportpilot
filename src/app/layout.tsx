import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://supportpilot-jet.vercel.app"),
  title: "SupportPilot | AI customer support trained on your docs",
  description:
    "An AI support chatbot that answers customers from your own help docs, cites its sources and hands off to a human when it isn't sure.",
  openGraph: {
    title: "SupportPilot: AI Customer Support Chatbot (RAG)",
    description: "AI support agent that answers from your own docs, cites sources and hands off to a human when unsure.",
    url: "https://supportpilot-jet.vercel.app",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}