import { notFound } from "next/navigation";
import { HeroCapture } from "@/components/hero/HeroCapture";

// /public/hero-{light,dark}{-narrow,}.webp を撮り直すための開発専用ルート。
// HeroBackground が使う静止画は、この Canvas を画枠ごとに焼いたもの。
// ?framing=narrow で狭い縦長の画面用 (4:3) を、既定では wide (16:9) を出す。
// ?bare=1 を付けると Canvas だけを左上に描くので、
// ヘッドレスブラウザのスクリーンショットがそのまま素材になる。
export default async function HeroCapturePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { mode, framing, bare } = await searchParams;

  return (
    <HeroCapture
      initialMode={mode === "dark" ? "dark" : "light"}
      initialFraming={framing === "narrow" ? "narrow" : "wide"}
      bare={bare !== undefined}
    />
  );
}
