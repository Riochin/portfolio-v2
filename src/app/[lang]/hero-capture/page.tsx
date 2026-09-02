import { notFound } from "next/navigation";
import { HeroCapture } from "@/components/hero/HeroCapture";

// /public/hero-{light,dark}.webp を撮り直すための開発専用ルート。
// HeroBackground が使う静止画は、この 16:9 の Canvas を焼いたもの。
// ?bare=1 を付けると Canvas だけを左上に描くので、
// ヘッドレスブラウザの 1280x720 スクリーンショットがそのまま素材になる。
export default async function HeroCapturePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { mode, bare } = await searchParams;

  return (
    <HeroCapture
      initialMode={mode === "dark" ? "dark" : "light"}
      bare={bare !== undefined}
    />
  );
}
