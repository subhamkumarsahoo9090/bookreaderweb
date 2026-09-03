import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is missing" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "file is required (audio)" },
      { status: 400 }
    );
  }

  const groqForm = new FormData();
  groqForm.append("file", file, (file as File).name || "audio.webm");
  groqForm.append("model", "whisper-large-v3");
  groqForm.append("response_format", "json");

  const res = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || "Transcription failed" },
      { status: 502 }
    );
  }

  const text = String(data.text || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "No speech detected in audio" },
      { status: 422 }
    );
  }

  return NextResponse.json({ success: true, text });
}
