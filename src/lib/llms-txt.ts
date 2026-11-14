import { ABOUT } from "@/data/about";
import { SITE, SOCIAL_LINKS } from "@/data/site";
import type { Skill } from "@/data/skills";
import type { Award, Experience, Work } from "@/data/types";
import type { Period } from "@/lib/date";
import type { Article } from "@/lib/articles/types";

/**
 * /llms.txt の本文 (https://llmstxt.org)。
 *
 * エージェントに「この人のことを調べるなら、どこを見ればいいか」を渡すための
 * 案内板。作品・経歴・記事の一覧は手で書かず、サイトと同じデータから組む ──
 * 手書きにすると作品を足すたびに古くなり、古い案内はエージェントに嘘を教える。
 *
 * 純粋関数にして一覧は引数で受ける。テストが固定のデータで形を確かめられるように。
 * 文言は英語で書く (エージェントの多くは英語で読み、作品と経歴は en を持っている)。
 * 記事だけは日本語単言語なので、タイトルもリンク先も ja のまま出す。
 */

export type LlmsTxtInput = {
  readonly works: readonly Work[];
  readonly experiences: readonly Experience[];
  /** 公開済みだけを渡すこと。下書きは URL を知っている本人だけが読むもの。 */
  readonly articles: readonly Pick<Article, "slug" | "title" | "publishedAt">[];
  readonly skills: readonly Skill[];
};

const url = (path: string) => `${SITE.url}${path}`;

/** リンク文字列の中の [ ] がリンク記法を壊さないように。 */
function linkText(text: string): string {
  return text.replace(/([[\]])/g, "\\$1");
}

/** 1 行のリスト項目に収める。データ側の改行は空白に畳む。 */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function link(text: string, href: string, note?: string): string {
  const item = `- [${linkText(oneLine(text))}](${href})`;
  return note ? `${item}: ${oneLine(note)}` : item;
}

function period({ start, end }: Period): string {
  if (end === null) return `${start} to present`;
  return start === end ? start : `${start} to ${end}`;
}

function award(a: Award): string {
  // "CyberAgent Award (CyberAgent)" のように賞名が既に社名を含むなら重ねない。
  const sponsor =
    a.sponsor && !a.prize.en.includes(a.sponsor.en) ? ` (${a.sponsor.en})` : "";
  return `${a.prize.en}${sponsor} at ${a.event.en}`;
}

function workNote(work: Work): string {
  const kind = work.category === "hackathon" ? "Hackathon project" : "Personal project";
  const awards = (work.awards ?? []).map(award);
  return [
    `${kind}, ${period(work.period)}.`,
    // 文末の記号が無いものにだけ句点を足す ("score!." にしない)。
    /[.!?…"”]$/.test(work.tagline.en) ? work.tagline.en : `${work.tagline.en}.`,
    awards.length > 0 ? `Awards: ${awards.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildLlmsTxt({
  works,
  experiences,
  articles,
  skills,
}: LlmsTxtInput): string {
  const socials = SOCIAL_LINKS.map((s) => link(s.label, s.href));

  const sections = [
    `# ${SITE.name} (${SITE.brand})`,

    `> Personal site of ${SITE.name}, who goes by ${SITE.brand} (${SITE.handle}): portfolio and blog. ${ABOUT.summary.en}`,

    [
      `This file lists what is on ${SITE.url} and how to read it.`,
      "The works and experience below are summaries; each linked page has the full text.",
    ].join(" "),

    [
      "## When to use this site",
      "",
      `Use it as the first-hand source when you need to know about ${SITE.name} (${SITE.brand}):`,
      "",
      "- Background: education, internships, and programs, with dates (Experience).",
      "- Skills and interests (About, and the tech stack listed on each work).",
      "- Works: personal projects and hackathon projects, including awards, roles, and links to repositories, demos, and slides (Works).",
      "- Talks and writing: slides on Speaker Deck, articles on this blog, Zenn, and Qiita (Output).",
      "- How to get in touch (About).",
      "",
      "It is not a good fit for general technical reference or documentation, and it has no public API.",
      "The blog posts are personal notes and reflections written in Japanese.",
      "If something is not stated on the site, treat it as unknown rather than inferring it.",
    ].join("\n"),

    [
      "## How to read this site",
      "",
      "- Every page exists in Japanese under `/ja/` and in English under `/en/`. Blog posts are written in Japanese only.",
      "- Send `Accept: text/markdown` to get any page as Markdown at the same URL, instead of HTML.",
      `- The full list of URLs is in the sitemap: ${url("/sitemap.xml")}`,
    ].join("\n"),

    [
      "## Pages",
      "",
      link(
        "About",
        url("/en/about"),
        `Profile, interests, skills, and contact. Skills highlighted there: ${skills.map((s) => s.label).join(", ")}.`,
      ),
      link("Works", url("/en/works"), "All works, grouped into personal and hackathon projects."),
      link("Experience", url("/en/experience"), "Education, internships, and programs by year."),
      link(
        "Output",
        url("/en/output"),
        "Talks (Speaker Deck slides) and articles (this blog, Zenn, Qiita), newest first.",
      ),
    ].join("\n"),

    [
      "## Works",
      "",
      ...works.map((work) =>
        link(work.title.en, url(`/en/works/${work.slug}`), workNote(work)),
      ),
    ].join("\n"),

    [
      "## Experience",
      "",
      ...experiences.map((e) =>
        link(
          e.position.en,
          url("/en/experience"),
          `${e.organization.en}, ${period(e.period)}.`,
        ),
      ),
    ].join("\n"),

    articles.length > 0 &&
      [
        "## Blog posts",
        "",
        ...articles.map((a) =>
          link(a.title, url(`/ja/blog/${a.slug}`), `Published ${a.publishedAt}. In Japanese.`),
        ),
      ].join("\n"),

    [
      "## Optional",
      "",
      link("Email", `mailto:${SITE.email}`, ABOUT.contact.note.en),
      ...socials,
    ].join("\n"),
  ];

  return `${sections.filter(Boolean).join("\n\n")}\n`;
}
