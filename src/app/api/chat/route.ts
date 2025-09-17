import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    baseURL: "https://0x29fdec2147d7ab5558e227f114b6928a9b611ce0.gaia.domains/v1",
    apiKey: "gaia",
  });

  const result = await streamText({
    model: openai.chat("Qwen3-4B-Q5_K_M"),
    messages,
  });
  return new Response(result.textStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
