"use client";

import { useEffect, type ReactNode } from "react";
import DriftWall from "@/components/DriftWall";
import "@/components/DriftWall.css";

/** Curated Unsplash education / study photos. */
const STUDY_WALL_ITEMS = [
  {
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Open book",
  },
  {
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Library shelves",
  },
  {
    image:
      "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Study notes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Writing desk",
  },
  {
    image:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Stack of books",
  },
  {
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Students collaborating",
  },
  {
    image:
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Classroom",
  },
  {
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Learning together",
  },
  {
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Laptop study",
  },
  {
    image:
      "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Notebook and pen",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Reading time",
  },
  {
    image:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Empty classroom",
  },
  {
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&h=400&q=80",
    title: "School hallway",
  },
  {
    image:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Creative notes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&h=400&q=80",
    title: "Vintage books",
  },
];

export function AuthScreen({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector("main");
    const prev = {
      htmlBg: html.style.background,
      bodyBg: body.style.background,
      mainBg: main instanceof HTMLElement ? main.style.background : "",
    };
    html.style.background = "#dbe4f0";
    body.style.background = "#dbe4f0";
    if (main instanceof HTMLElement) main.style.background = "transparent";
    return () => {
      html.style.background = prev.htmlBg;
      body.style.background = prev.bodyBg;
      if (main instanceof HTMLElement) main.style.background = prev.mainBg;
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        // Explicit height so absolute children fill the viewport (min-height alone is not enough)
        height: "100dvh",
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        background: "#dbe4f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
          filter: "blur(1px)",
          transform: "scale(1.04)",
        }}
      >
        <DriftWall
          items={STUDY_WALL_ITEMS}
          columns={10}
          tileWidth={168}
          tileHeight={112}
          gap={12}
          tilt={8}
          turn={-6}
          perspective={1600}
          depth={40}
          speed={28}
          direction="up"
          variance={0.35}
          parallax={0}
          lift={28}
          fade={0.15}
          dim={0.95}
          overlayColor="transparent"
          radius={12}
          roll={0}
          pauseOnHover={false}
          grayscale={false}
          className="auth-drift-wall"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(219,228,240,0.35) 0%, rgba(219,228,240,0.12) 45%, rgba(219,228,240,0.4) 100%)",
          }}
        />
      </div>

      <div className="auth-card animate-fade-up">
        <div className="auth-card__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-aksharax.png"
            alt="AksharaX"
            width={280}
            height={158}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
