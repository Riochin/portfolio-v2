import * as simpleIcons from "simple-icons";
import type { Skill } from "@/data/skills";

type SimpleIcon = { path: string; title: string };

/**
 * simple-icons は path データ (React コンポーネントではない) を配るので、
 * データ側はスラッグ文字列だけ持てばよく、シリアライズ可能なまま保てる。
 * 旧サイトが Skill.icon に react-icons のコンポーネント参照を埋めていたのとは対照的。
 */
function lookup(slug: string): SimpleIcon | undefined {
  const key = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  return (simpleIcons as unknown as Record<string, SimpleIcon | undefined>)[key];
}

export function SkillIcon({ skill, size = 22 }: { skill: Skill; size?: number }) {
  const icon = skill.icon ? lookup(skill.icon) : undefined;

  // AWS などブランド都合でアイコンが配られていない技術は頭文字にフォールバックする
  if (!icon) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        className="flex items-center justify-center rounded font-bold text-muted-foreground"
      >
        {skill.label.slice(0, 3)}
      </span>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}
