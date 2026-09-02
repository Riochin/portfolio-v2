import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * 一覧タイル 1 件分。
 * サーバー側でロケール解決済みのプレーンなデータだけを受け取る
 * (src/data のアクセサはロケール非依存なので、解決は page.tsx で行う)。
 */
export type WorkGridItem = {
  readonly slug: string;
  readonly href: string;
  readonly title: string;
  readonly period: string;
  readonly image?: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
    readonly alt: string;
  };
  readonly stack: readonly string[];
};

/** 1 件ごとの出現ディレイ。DOM 順 = 左上から右下の順になる。 */
const STAGGER_MS = 60;

/** 一覧タイルと詳細ページの hero を結ぶ view transition の名前。 */
export function workImageTransitionName(slug: string): string {
  return `work-image-${slug}`;
}

export function WorkGrid({ items }: { items: readonly WorkGridItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((work, index) => (
        <li
          key={work.slug}
          className="group reveal-rise"
          style={
            { "--reveal-delay": `${index * STAGGER_MS}ms` } as React.CSSProperties
          }
        >
          <Link href={work.href}>
            {/* 詳細ページの hero と同じ name を付けて、クリック時に画像がそのまま
                拡大するモーフにする。戻るときは同じモーフが自動で逆再生される
                (ブラウザの戻るボタンでも同様)。 */}
            <ViewTransition
              name={workImageTransitionName(work.slug)}
              share="morph"
              default="none"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-accent/25 to-accent/5">
                {work.image && (
                  <Image
                    src={work.image.src}
                    alt={work.image.alt}
                    width={work.image.width}
                    height={work.image.height}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
            </ViewTransition>

            <p className="mt-2.5 font-medium group-hover:text-accent">
              {work.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {work.period}
            </p>
            <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {work.stack.map((label) => (
                <span
                  key={label}
                  className="rounded-xl border border-border px-2 py-0.5"
                >
                  {label}
                </span>
              ))}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
