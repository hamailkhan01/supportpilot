"use client";

import { OPEN_CHAT_EVENT } from "@/lib/constants";

export function AskButton({
  question,
  className,
  children,
}: {
  question?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: question }))}
    >
      {children}
    </button>
  );
}
