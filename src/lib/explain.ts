export type ExplainResponse = {
  success: boolean;
  explanation: string;
  sentences: string[];
};

export async function explainSelection(text: string, context?: string) {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context: context || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || "Could not explain selection"
    );
  }
  return data as ExplainResponse;
}
