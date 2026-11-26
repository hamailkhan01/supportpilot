export type KbDocument = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

export type Tone = "friendly" | "professional" | "concise";

export type Settings = {
  businessName: string;
  assistantName: string;
  welcomeMessage: string;
  tone: Tone;
  brandColor: string;
  suggestedQuestions: string[];
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type Source = {
  docId: string;
  title: string;
  excerpt: string;
  score: number;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  question: string;
  createdAt: number;
};

export type Mode = "openai" | "anthropic" | "demo";

export type ChatRequestBody = {
  messages: ChatMessage[];
  documents: KbDocument[];
  settings: Settings;
};
