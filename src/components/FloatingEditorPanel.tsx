"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FontFamilyId } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/types";

const PANEL_KEY = "aksharax_editor_panel";

type PanelBox = { x: number; y: number; w: number; h: number };

function loadBox(): PanelBox {
  if (typeof window === "undefined") {
    return { x: 24, y: 80, w: 420, h: 480 };
  }
  try {
    const raw = localStorage.getItem(PANEL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PanelBox;
      if (
        typeof parsed.x === "number" &&
        typeof parsed.y === "number" &&
        typeof parsed.w === "number" &&
        typeof parsed.h === "number"
      ) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const w = Math.min(520, window.innerWidth - 32);
  const h = Math.min(560, window.innerHeight - 48);
  return {
    x: Math.max(16, (window.innerWidth - w) / 2),
    y: Math.max(64, (window.innerHeight - h) / 4),
    w,
    h,
  };
}

function fontClass(id: FontFamilyId) {
  return `font-reader-${id}`;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  onHandwrite: () => void;
  statusLabel: string;
  fontFamily: FontFamilyId;
  onFontFamilyChange: (f: FontFamilyId) => void;
  fontSize: number;
  onFontSizeChange: (n: number) => void;
  lineSpacing: number;
  onLineSpacingChange: (n: number) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export function FloatingEditorPanel({
  value,
  onChange,
  onSave,
  onClose,
  onHandwrite,
  statusLabel,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  lineSpacing,
  onLineSpacingChange,
  textareaRef,
}: Props) {
  const [box, setBox] = useState<PanelBox>(loadBox);
  const drag = useRef<{
    kind: "move" | "resize";
    startX: number;
    startY: number;
    orig: PanelBox;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(PANEL_KEY, JSON.stringify(box));
  }, [box]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const o = drag.current.orig;
    if (drag.current.kind === "move") {
      setBox({
        ...o,
        x: Math.max(0, Math.min(window.innerWidth - 80, o.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 80, o.y + dy)),
      });
    } else {
      setBox({
        ...o,
        w: Math.max(280, Math.min(window.innerWidth - o.x - 8, o.w + dx)),
        h: Math.max(280, Math.min(window.innerHeight - o.y - 8, o.h + dy)),
      });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  function startDrag(kind: "move" | "resize", e: React.PointerEvent) {
    e.preventDefault();
    drag.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...box },
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Document editor"
      className="fixed z-[70] flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-lg)]"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
      }}
    >
      <div
        className="flex cursor-grab items-center gap-2 border-b border-[var(--line)] bg-[var(--wash)] px-3 py-2 active:cursor-grabbing"
        onPointerDown={(e) => startDrag("move", e)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Edit
        </span>
        <span className="ml-auto text-xs text-[var(--muted)]">{statusLabel}</span>
        <button
          type="button"
          className="ui-btn ui-btn-ghost !px-2 !py-1 text-xs"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Close
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-3 py-2">
        <label className="text-xs text-[var(--muted)]">
          Font
          <select
            value={fontFamily}
            onChange={(e) =>
              onFontFamilyChange(e.target.value as FontFamilyId)
            }
            className="ml-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-xs"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--muted)]">
          Size
          <input
            type="range"
            min={14}
            max={28}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="ml-1 w-20 align-middle"
          />
        </label>
        <label className="text-xs text-[var(--muted)]">
          Spacing
          <input
            type="range"
            min={1.2}
            max={2.4}
            step={0.1}
            value={lineSpacing}
            onChange={(e) => onLineSpacingChange(Number(e.target.value))}
            className="ml-1 w-20 align-middle"
          />
        </label>
        <button
          type="button"
          onClick={onHandwrite}
          className="ui-btn ui-btn-ghost !px-2 !py-1 text-xs"
        >
          Handwrite
        </button>
        <button
          type="button"
          onClick={onSave}
          className="ui-btn ui-btn-primary !px-3 !py-1 text-xs"
        >
          Save
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-0 flex-1 resize-none bg-[var(--paper)] p-4 text-[var(--ink)] outline-none ${fontClass(fontFamily)}`}
        style={{ fontSize, lineHeight: lineSpacing }}
        aria-label="Edit document text"
        spellCheck
      />

      <div
        className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm bg-[var(--line)]"
        onPointerDown={(e) => startDrag("resize", e)}
        aria-hidden
      />
    </div>
  );
}
