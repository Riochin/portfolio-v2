import Image from "next/image";
import type { TopTrack } from "@/lib/spotify/types";

/** 1 件ごとの出現ディレイ。OutputGrid / WorkGrid と揃える。 */
const STAGGER_MS = 60;

/**
 * Output の一覧タイルと同じ作りでジャケットを並べる。
 *
 * タイルが 16:9 でも 16:10 でもなく正方形なのは、敷くのがアルバムアートで
 * 元が 640x640 だから。横長に切ると object-cover がジャケットの上下を削る。
 */
export function TrackGrid({ tracks }: { tracks: readonly TopTrack[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3">
      {tracks.map((track, index) => (
        <li
          key={track.id}
          className="group reveal-rise"
          style={
            {
              "--reveal-delay": `${index * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          <a href={track.url} target="_blank" rel="noopener noreferrer">
            <div className="photo-frame relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-accent/5">
              {track.artwork && (
                <Image
                  src={track.artwork}
                  // 曲名とアーティストがすぐ下にテキストで出るので、
                  // ジャケットは装飾として扱い読み上げから外す。
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>

            <p className="mt-2.5 text-sm font-medium group-hover:text-accent">
              {track.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {track.artists}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
