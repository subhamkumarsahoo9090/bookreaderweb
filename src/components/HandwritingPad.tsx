"use client";

import { useEffect, useRef, useState } from "react";
import { documentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Props = {
  onInsert: (text: string) => void;
  onClose: () => void;
};

type Point = { x: number; y: number };

export function HandwritingPad({ onInsert, onClose }: Props) {
  const { token } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef<Point[][]>([]);
  const current = useRef<Point[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    redraw();
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes.current) {
      if (!stroke.length) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    current.current = [pos(e)];
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    current.current.push(pos(e));
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || current.current.length < 2) return;
    const a = current.current[current.current.length - 2];
    const b = current.current[current.current.length - 1];
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    if (current.current.length) strokes.current.push(current.current);
    current.current = [];
  }

  function undoStroke() {
    strokes.current.pop();
    redraw();
    setPreview("");
  }

  function clearAll() {
    strokes.current = [];
    redraw();
    setPreview("");
    setError("");
  }

  async function recognize() {
    if (!token || !canvasRef.current) return;
    if (!strokes.current.length) {
      setError("Write something first");
      return;
    }
    setRecognizing(true);
    setError("");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Could not capture handwriting");
      const res = await documentsApi.recognize(token, blob);
      setPreview(res.text.trim());
      if (!res.text.trim()) setError("No text recognized — try larger letters");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recognition failed");
    } finally {
      setRecognizing(false);
    }
  }

  function insert() {
    if (!preview.trim()) return;
    onInsert(preview.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-3 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xl"
        role="dialog"
        aria-label="Handwriting pad"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Handwrite
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--wash)]"
          >
            Cancel
          </button>
        </div>
        <p className="mb-2 text-sm text-[var(--muted)]">
          Write with your finger or stylus, then recognize and insert.
        </p>
        <canvas
          ref={canvasRef}
          className="h-48 w-full touch-none rounded-xl border border-[var(--line)] bg-white"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Handwriting canvas"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undoStroke}
            className="rounded-lg bg-[var(--wash)] px-3 py-2 text-sm"
          >
            Undo stroke
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg bg-[var(--wash)] px-3 py-2 text-sm"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={recognizing}
            onClick={recognize}
            className="rounded-lg bg-[var(--moss)] px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {recognizing ? "Recognizing…" : "Recognize"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-[var(--accent)]">{error}</p>}
        {preview && (
          <div className="mt-3 rounded-xl bg-[var(--wash)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Recognized
            </p>
            <p className="mt-1 text-sm text-[var(--ink)]">{preview}</p>
            <button
              type="button"
              onClick={insert}
              className="mt-2 rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)]"
            >
              Insert into document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
