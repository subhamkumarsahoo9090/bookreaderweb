import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const text = String(body.text || "").trim().slice(0, 12000);
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const prompt = `Create exactly 5 multiple-choice quiz questions from this reading passage for language learners.
Reply with ONLY valid JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 0,
      "explanation": "short why"
    }
  ]
}

Passage:
"""
${text}
"""`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return compact JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || "Quiz generation failed" },
      { status: 502 }
    );
  }

  const raw = data.choices?.[0]?.message?.content || "{}";
  let parsed: { questions?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid quiz JSON" }, { status: 502 });
  }

  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.slice(0, 5)
    : [];

  return NextResponse.json({ success: true, questions });
}
