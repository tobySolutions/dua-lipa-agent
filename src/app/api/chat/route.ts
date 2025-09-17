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

  // Convert async iterable stream of strings to a byte stream
  const stream = new ReadableStream({
    async pull(controller) {
      for await (const chunk of result.textStream) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
