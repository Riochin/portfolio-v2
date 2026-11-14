import {
  getAwards,
  getExperiencesByYear,
  getFeaturedSkills,
  getHomeWorks,
  getSkills,
  getWorkBySlug,
  getWorksByCategory,
} from "@/data";
import { ABOUT } from "@/data/about";
import { NAV_ITEMS, SITE } from "@/data/site";
import type { Work } from "@/data/types";
import { getArticleBySlug } from "@/lib/articles";
import { formatPeriod, formatYearMonth, formatYearMonthDay } from "@/lib/date";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { DICT } from "@/lib/i18n/dictionary";
import { localePath } from "@/lib/i18n/paths";
import { translator, type Translator } from "@/lib/i18n/types";
import { getOutputItems, getRecentOutputs } from "@/lib/output";
import { ARTICLES_ANCHOR } from "@/lib/output/config";
import { formatPublishedAt } from "@/lib/output/format";
import type { OutputItem } from "@/lib/output/types";

/**
 * 各ページの Markdown 版。`Accept: text/markdown` で来たエージェントに、
 * HTML と同じ URL のまま返す (proxy.ts → app/markdown/[...path]/route.ts)。
 *
 * 中身は HTML のページと同じ情報源 (src/data・content/articles) から組む。
 * 見た目のための部品 (写真・アイコン・もっとみる) は持たず、文字と
 * リンクだけにする。リンクは Markdown だけ持ち出されても辿れるよう絶対 URL。
 */

export type MarkdownPage = {
  readonly status: 200 | 404;
  readonly body: string;
};

/** "/works" -> "https://riochin.dev/ja/works" */
function url(locale: Locale, path: string): string {
  return `${SITE.url}${localePath(locale, path)}`;
}

/** 外部 URL はそのまま、サイト内のパス ("/ja/blog/x" など) は絶対 URL に。 */
function absolute(href: string): string {
  return href.startsWith("/") ? `${SITE.url}${href}` : href;
}

/** リンク文字列の中で Markdown の記号として読まれてしまうものを逃がす。 */
function escapeText(text: string): string {
  return text.replace(/([\\[\]*_`])/g, "\\$1");
}

function link(text: string, href: string): string {
  return `[${escapeText(text)}](${href})`;
}

/** 空行区切りでブロックをつなぐ。undefined / 空は落とす。 */
function blocks(...parts: (string | false | undefined)[]): string {
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

/** どのページの末尾にも付ける、サイト内の行き先。 */
function siteNav(locale: Locale, t: Translator): string {
  const items = [
    link("Home", url(locale, "/")),
    ...NAV_ITEMS.map((item) =>
      link(t(DICT.nav[item.key]), url(locale, item.path)),
    ),
    link("sitemap.xml", `${SITE.url}/sitemap.xml`),
  ];
  return `---\n\n${items.join(" · ")}`;
}

function outputList(items: readonly OutputItem[], emptyLabel: string): string {
  if (items.length === 0) return emptyLabel;
  return items
    .map(
      (item) =>
        `- ${formatPublishedAt(item.publishedAt)} ${link(item.title, absolute(item.url))}`,
    )
    .join("\n");
}

function workLine(work: Work, locale: Locale, t: Translator): string {
  return `- ${link(t(work.title), url(locale, `/works/${work.slug}`))} — ${t(work.tagline)}`;
}

async function home(locale: Locale, t: Translator): Promise<string> {
  const { talks, articles } = await getRecentOutputs(locale, {
    talks: 4,
    articles: 3,
  });

  const journey = ABOUT.journey
    .map((step) => {
      const text = step.href
        ? link(
            t(step.text),
            step.href.startsWith("/") ? url(locale, step.href) : step.href,
          )
        : t(step.text);
      return `- ${formatYearMonth(step.date)} ${text}`;
    })
    .join("\n");

  return blocks(
    `# ${SITE.name}`,
    `${t(DICT.home.role)} — ${t(ABOUT.summary)}`,
    link(t(DICT.home.more), url(locale, "/about")),
    `## ${t(DICT.experience.heading)}`,
    journey,
    link(t(DICT.home.allExperience), url(locale, "/experience")),
    `## ${t(DICT.home.featured)}`,
    getHomeWorks()
      .map((work) => workLine(work, locale, t))
      .join("\n"),
    link(t(DICT.home.allWorks), url(locale, "/works")),
    talks.length > 0 && `## ${t(DICT.home.recentTalks)}`,
    talks.length > 0 && outputList(talks, ""),
    articles.length > 0 && `## ${t(DICT.home.recentArticles)}`,
    articles.length > 0 && outputList(articles, ""),
    link(t(DICT.home.allArticles), `${url(locale, "/output")}#${ARTICLES_ANCHOR}`),
    siteNav(locale, t),
  );
}

function about(locale: Locale, t: Translator): string {
  const facts = ABOUT.facts
    .map((fact) => `- **${t(fact.label)}**: ${t(fact.value).replaceAll("\n", " / ")}`)
    .join("\n");

  return blocks(
    `# ${t(DICT.pages.about)}`,
    `${SITE.name} (${link(SITE.handle, SITE.handleUrl)})`,
    facts,
    // 段落は元から `**…**` の強調を Markdown の記法で持っている。
    ...ABOUT.paragraphs.map((paragraph) => t(paragraph)),
    ...ABOUT.sections.flatMap((section) => [
      `## ${t(section.label)}`,
      section.items.map((item) => `- ${t(item)}`).join("\n"),
    ]),
    `## ${t(DICT.about.skills)}`,
    getFeaturedSkills()
      .map((skill) => `- ${skill.label}`)
      .join("\n"),
    `## ${t(ABOUT.contact.label)}`,
    t(ABOUT.contact.note),
    `- Email: ${link(SITE.email, `mailto:${SITE.email}`)}\n- X: ${link(SITE.handle, SITE.handleUrl)}`,
    siteNav(locale, t),
  );
}

function works(locale: Locale, t: Translator): string {
  const awards = getAwards()
    .map(
      (award) =>
        `- ${formatYearMonth(award.date)} ${t(award.prize)} — ${t(award.event)} (${link(t(award.work.title), url(locale, `/works/${award.work.slug}`))})`,
    )
    .join("\n");

  return blocks(
    `# ${t(DICT.pages.works)}`,
    ...getWorksByCategory().flatMap((group) => [
      `## ${t(DICT.workCategories[group.category])}`,
      group.works.map((work) => workLine(work, locale, t)).join("\n"),
    ]),
    `## ${t(DICT.works.awards)}`,
    awards,
    siteNav(locale, t),
  );
}

function work(locale: Locale, t: Translator, slug: string): string | undefined {
  const entry = getWorkBySlug(slug);
  if (!entry) return undefined;

  const links = (["repo", "demo", "article", "slides"] as const)
    .filter((key) => entry.links[key])
    .map((key) => `- ${link(t(DICT.works[key]), entry.links[key]!)}`)
    .join("\n");

  return blocks(
    `# ${t(entry.title)}`,
    t(entry.tagline),
    `- ${formatPeriod(entry.period, locale)}\n- ${t(DICT.workCategories[entry.category])}`,
    ...entry.body.map((paragraph) => t(paragraph)),
    entry.role && `## ${t(DICT.works.role)}`,
    entry.role && t(entry.role),
    `## ${t(DICT.works.stack)}`,
    getSkills(entry.stack)
      .map((skill) => `- ${skill.label}`)
      .join("\n"),
    entry.awards && `## ${t(DICT.works.awards)}`,
    entry.awards
      ?.map(
        (award) =>
          `- ${formatYearMonth(award.date)} ${t(award.prize)} — ${award.url ? link(t(award.event), award.url) : t(award.event)}`,
      )
      .join("\n"),
    links && `## Links`,
    links,
    link(t(DICT.works.back), url(locale, "/works")),
    siteNav(locale, t),
  );
}

function experience(locale: Locale, t: Translator): string {
  return blocks(
    `# ${t(DICT.pages.experience)}`,
    ...getExperiencesByYear().flatMap((group) => [
      `## ${group.year}`,
      ...group.experiences.map((exp) =>
        [
          `### ${t(exp.position)}`,
          "",
          `${t(exp.organization)} · ${formatPeriod(exp.period, locale)}`,
          "",
          ...exp.highlights.map((highlight) => `- ${t(highlight)}`),
          ...(exp.stack
            ? ["", `Stack: ${getSkills(exp.stack).map((skill) => skill.label).join(", ")}`]
            : []),
          ...(exp.url ? ["", link(t(DICT.experience.report), exp.url)] : []),
        ].join("\n"),
      ),
    ]),
    siteNav(locale, t),
  );
}

async function output(locale: Locale, t: Translator): Promise<string> {
  const { talks, articles } = await getOutputItems(locale);
  const empty = t(DICT.output.empty);

  return blocks(
    `# ${t(DICT.pages.output)}`,
    `## ${t(DICT.output.talks)}`,
    outputList(talks, empty),
    `## ${t(DICT.output.articles)}`,
    outputList(articles, empty),
    siteNav(locale, t),
  );
}

/**
 * 記事は content/articles/<slug>.md の本文をそのまま返す。
 * 頭に付けるのはタイトルと公開日だけ (HTML のページが本文の上に出すもの)。
 * 本文の h1 は HTML 側では h2 に落とすが、ここでは元の Markdown を崩さない。
 */
function article(locale: Locale, t: Translator, slug: string): string | undefined {
  const entry = getArticleBySlug(slug);
  if (!entry) return undefined;

  return blocks(
    `# ${entry.title}`,
    `${formatYearMonthDay(entry.publishedAt)}${entry.draft ? ` (${t(DICT.blog.draft)})` : ""} · ${SITE.name}`,
    entry.markdown.trim(),
    link(t(DICT.blog.back), `${url(locale, "/output")}#${ARTICLES_ANCHOR}`),
    siteNav(locale, t),
  );
}

/**
 * 404 の本文。ステータスは 404 のまま、何が起きたかと戻り先を載せる。
 * HTML の 404 (app/[lang]/not-found.tsx) と同じ文言に、エージェントが
 * 次に辿れる入口 (ホーム・記事一覧・sitemap.xml) を足す。
 */
export function notFoundMarkdown(locale: Locale): string {
  const t = translator(locale);
  return blocks(
    `# ${t(DICT.notFound.title)}`,
    t(DICT.notFound.message),
    [
      `- ${link(t(DICT.notFound.home), url(locale, "/"))}`,
      `- ${link(t(DICT.home.allArticles), `${url(locale, "/output")}#${ARTICLES_ANCHOR}`)}`,
      `- ${link("sitemap.xml", `${SITE.url}/sitemap.xml`)}`,
    ].join("\n"),
  );
}

/**
 * ロケール付きのパス ("/ja/works/lsib") の Markdown 版。
 * HTML 側にページが無いパスは 404 と notFoundMarkdown を返す。
 */
export async function renderMarkdown(pathname: string): Promise<MarkdownPage> {
  const [, first, ...rest] = pathname.replace(/\/+$/, "").split("/");
  const locale: Locale = isLocale(first) ? first : "ja";
  const notFound = { status: 404, body: notFoundMarkdown(locale) } as const;
  if (!isLocale(first)) return notFound;

  const t = translator(locale);
  let segments: string[];
  try {
    segments = rest.map((segment) => decodeURIComponent(segment));
  } catch {
    // 壊れた %xx。HTML 側でも引けるページは無い。
    return notFound;
  }

  const body = await (async () => {
    switch (segments.length) {
      case 0:
        return home(locale, t);
      case 1:
        switch (segments[0]) {
          case "about":
            return about(locale, t);
          case "works":
            return works(locale, t);
          case "experience":
            return experience(locale, t);
          case "output":
            return output(locale, t);
        }
        return undefined;
      case 2:
        if (segments[0] === "works") return work(locale, t, segments[1]);
        if (segments[0] === "blog") return article(locale, t, segments[1]);
        return undefined;
    }
    return undefined;
  })();

  return body === undefined ? notFound : { status: 200, body };
}
