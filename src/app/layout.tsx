import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportPilot | AI customer support trained on your docs",
  description:
    "An AI support chatbot that answers customers from your own help docs, cites its sources and hands off to a human when it isn't sure.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
