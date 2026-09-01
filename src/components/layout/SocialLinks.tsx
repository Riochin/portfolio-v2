import { GithubIcon } from "@/components/icons/GithubIcon";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { XIcon } from "@/components/icons/XIcon";
import { SpeakerDeckIcon } from "@/components/icons/SpeakerDeckIcon";
import { ZennIcon } from "@/components/icons/ZennIcon";

const socialLinks = [
  { href: "https://github.com/riochin", label: "GitHub", Icon: GithubIcon },
  { href: "https://x.com/riochin", label: "X", Icon: XIcon },
  {
    href: "https://speakerdeck.com/riochin",
    label: "Speaker Deck",
    Icon: SpeakerDeckIcon,
  },
  {
    href: "https://www.linkedin.com/in/rio-ichikawa-94332b361/",
    label: "LinkedIn",
    Icon: LinkedinIcon,
  },
  { href: "https://zenn.dev/riochin", label: "Zenn", Icon: ZennIcon },
] as const;

export function SocialLinks({
  direction = "column",
}: {
  direction?: "column" | "row";
}) {
  return (
    <ul
      className={`flex gap-6 ${direction === "column" ? "flex-col" : "flex-row"}`}
    >
      {socialLinks.map(({ href, label, Icon }) => (
        <li key={label}>
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
      ))}
    </ul>
  );
}
