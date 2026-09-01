import { notFound } from "next/navigation";
import { HeroCapture } from "@/components/hero/HeroCapture";

// /public/hero-{light,dark}.webp を撮り直すための開発専用ルート。
// HeroBackground が使う静止画は、この 16:9 の Canvas を焼いたもの。
export default function HeroCapturePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <HeroCapture />;
}
