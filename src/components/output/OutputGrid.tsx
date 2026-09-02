import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { OutputItem } from "@/lib/output/types";

/**
 * 画面には出さない。サムネイルが OGP なので見れば出典は分かるが、
 * 読み上げには残したいのでリンクのアクセシブルネームに混ぜる。
 */
const SOURCE_LABELS: Record<OutputItem["source"], string> = {
  speakerdeck: "Speaker Deck",
  zenn: "Zenn",
  qiita: "Qiita",
};

/** 1 件ごとの出現ディレイ。DOM 順 = 左上から右下の順になる。WorkGrid と揃える。 */
const STAGGER_MS = 60;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Works の一覧タイルと同じ見た目で外部のアウトプットを並べる。
 * 遷移先が外部サイトなので、Works と違って view transition は張らない。
 */
export function OutputGrid({
  items,
  emptyLabel,
}: {
  items: readonly OutputItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={item.url}
          className="group reveal-rise"
          style={
            { "--reveal-delay": `${index * STAGGER_MS}ms` } as React.CSSProperties
          }
        >
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {/* Works のタイルは 16:10 だが、ここだけ 16:9。
                敷くのが自前の写真ではなく他所の OGP (Speaker Deck は 16:9、
                Zenn / Qiita は 1200x630) で、16:10 まで詰めると object-cover が
                左右を削って画像内の見出しが切れてしまうため。 */}
            <div className="photo-frame relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-accent/5">
              {item.thumbnail && (
                <Image
                  src={item.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>

            <p className="mt-2.5 font-medium group-hover:text-accent">
              {item.title}
              <span className="sr-only">（{SOURCE_LABELS[item.source]}）</span>
              <ExternalLink
                size={14}
                className="ml-1 inline-block align-baseline opacity-60"
              />
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <time dateTime={item.publishedAt}>
                {formatDate(item.publishedAt)}
              </time>
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
