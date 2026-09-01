"use client";

import dynamic from "next/dynamic";

export const HeroCanvasWrapper = dynamic(() => import("./HeroScene"), {
  ssr: false,
});
