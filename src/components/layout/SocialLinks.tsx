import type { ComponentType } from "react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { Mixi2Icon } from "@/components/icons/Mixi2Icon";
import { XIcon } from "@/components/icons/XIcon";
import { SpeakerDeckIcon } from "@/components/icons/SpeakerDeckIcon";
import { ZennIcon } from "@/components/icons/ZennIcon";
import { SOCIAL_LINKS, type SocialKey } from "@/data/site";

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
      {SOCIAL_LINKS.map(({ key, href, label }) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="block text-foreground transition-colors hover:text-accent"
            >
              <Icon size={26} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
