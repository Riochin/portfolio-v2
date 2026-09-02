import type { ComponentType, CSSProperties } from "react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { Mixi2Icon } from "@/components/icons/Mixi2Icon";
import { XIcon } from "@/components/icons/XIcon";
import { SpeakerDeckIcon } from "@/components/icons/SpeakerDeckIcon";
import { ZennIcon } from "@/components/icons/ZennIcon";
import { SOCIAL_LINKS, type SocialKey, type SocialLink } from "@/data/site";

/**
 * key -> アイコンの対応はここに置く。データ側 (src/data/site.ts) には
 * シリアライズできない値を入れないため。Record<SocialKey, ...> なので
 * SNS を足したときにアイコンの追加漏れが型エラーになる。
 */
const ICONS: Record<
  SocialKey,
  ComponentType<{ size?: number; className?: string }>
> = {
  github: GithubIcon,
  mixi2: Mixi2Icon,
  x: XIcon,
  speakerdeck: SpeakerDeckIcon,
  linkedin: LinkedinIcon,
  zenn: ZennIcon,
};

export function SocialLinks({
  direction = "column",
}: {
  direction?: "column" | "row";
}) {
  return (
    <ul
      className={`flex gap-6 ${direction === "column" ? "flex-col" : "flex-row"}`}
    >
      {/* as const で literal 型に潰れると省略した brandDark が型に出てこないので、
          ここで SocialLink として受け直す。 */}
      {SOCIAL_LINKS.map(({ key, href, label, brand, brandDark }: SocialLink) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              /* ブランド色は数が増えるので Tailwind の任意値ではなく CSS 変数で渡す。
                 クラス名は静的なままにしておかないと Tailwind が拾えない。 */
              style={
                {
                  "--brand": brand,
                  "--brand-dark": brandDark ?? brand,
                } as CSSProperties
              }
              className="group block text-foreground"
            >
              {/* fill を currentColor から差し替えるので、色の変化は svg 側で受ける。
                  ブランド色が url(#...) のときも fill なら同じ書き方で通る。
                  拡大はやめて、待機中に少し落とした濃度をホバーで戻す
                  フェードだけにしてある。fill と opacity が同じ長さで
                  重なるので、色がじわっと差してくるように見える。 */}
              <Icon
                size={30}
                className="opacity-70 transition-[fill,opacity] duration-300 ease-out group-hover:fill-[var(--brand)] group-hover:opacity-100 dark:group-hover:fill-[var(--brand-dark)]"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
