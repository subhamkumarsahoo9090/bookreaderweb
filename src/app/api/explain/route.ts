import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type ExplainBody = {
  text?: string;
  context?: string;
};

type ExplainPayload = {
  explanation: string;
  sentences: string[];
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.1-8b-instant was shut down Aug 2026; gpt-oss-20b is Groq's free replacement.
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";

function buildPrompt(text: string, context?: string) {
  const contextLine = context?.trim()
    ? `\nContext sentence from the reading: "${context.trim()}"`
    : "";

  return `You are an English vocabulary tutor for everyday learners.
Reply with ONLY valid JSON (no markdown fences, no extra text):

{
  "explanation": "Clear, simple explanation of the meaning in easy English (1-3 short sentences).",
  "sentences": [
    "Simple everyday life sentence using the word/phrase.",
    "Another simple daily-life sentence.",
    "A third simple daily-life sentence."
  ]
}

Rules:
- Explain the difficult word or phrase so a beginner can understand it.
- Each of the 3 sentences must use the exact word/phrase naturally.
- Keep sentences short and useful in day-to-day conversation.
- If a context sentence is given, match the meaning used there.

Word or phrase: "${text.trim()}"${contextLine}`;
}

function parseExplainResult(raw: string): ExplainPayload {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON");
  }

  const parsed = JSON.parse(candidate.slice(start, end + 1)) as {
    explanation?: unknown;
    sentences?: unknown;
  };

  const explanation =
    typeof parsed.explanation === "string" ? parsed.explanation.trim() : "";
  const sentences = Array.isArray(parsed.sentences)
    ? parsed.sentences
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  if (!explanation || sentences.length === 0) {
    throw new Error("Model response missing explanation or sentences");
  }

  while (sentences.length < 3) {
    sentences.push(sentences[sentences.length - 1]);
  }

  return { explanation, sentences: sentences.slice(0, 3) };
}

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You help language learners. Always respond with compact JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Groq API error (${res.status})`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq returned an empty response");
  return content;
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY is missing. Get a free key at https://console.groq.com/keys and add it to bookreaderweb/.env",
      },
      { status: 500 }
    );
  }

  let body: ExplainBody;
  try {
    body = (await req.json()) as ExplainBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "text is required (word or sentence)" },
      { status: 400 }
    );
  }
  if (text.length > 500) {
    return NextResponse.json(
      { error: "Selection is too long (max 500 characters)" },
      { status: 400 }
    );
  }

  const context =
    typeof body.context === "string" ? body.context.trim().slice(0, 800) : "";

  try {
    const raw = await callGroq(apiKey, buildPrompt(text, context));
    const payload = parseExplainResult(raw);
    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Explain request failed",
      },
      { status: 502 }
    );
  }
}
