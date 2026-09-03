import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is missing" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim().slice(0, 2000);
  const targetLang = String(body.targetLang || "hi").trim() || "hi";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Translate clearly for learners. Return JSON: {"translation":"...","language":"code"}',
        },
        {
          role: "user",
          content: `Translate to language code "${targetLang}":\n${text}`,
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || "Translation failed" },
      { status: 502 }
    );
  }

  const raw = data.choices?.[0]?.message?.content || "{}";
  let translation = "";
  try {
    const parsed = JSON.parse(raw);
    translation = String(parsed.translation || "").trim();
  } catch {
    translation = raw.trim();
  }

  return NextResponse.json({
    success: true,
    translation,
    targetLang,
  });
}
