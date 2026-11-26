import { getMode } from "@/lib/llm";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ mode: getMode() });
}
