import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    baseURL: process.env.GAIA_BASE_URL,
    apiKey: process.env.GAIA_API_KEY,
  });

  const result = await streamText({
    model: openai.chat("Qwen3-4B-Q5_K_M"),
    messages,
  });
  return new Response(result.textStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
