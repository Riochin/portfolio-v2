import { ExternalLink } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { getOutputItems } from "@/lib/output";
import type { OutputItem } from "@/lib/output/types";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/output", title: DICT.pages.output });

const sourceLabels: Record<OutputItem["source"], string> = {
  speakerdeck: "Speaker Deck",
  zenn: "Zenn",
  qiita: "Qiita",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function OutputList({
  items,
  emptyLabel,
}: {
  items: OutputItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.url}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-baseline justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <span className="flex-1">
              <span className="block font-medium group-hover:text-accent">
                {item.title}
                <ExternalLink
                  size={14}
                  className="ml-1 inline-block align-baseline opacity-60"
                />
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {sourceLabels[item.source]}
              </span>
            </span>
            <time
              dateTime={item.publishedAt}
              className="shrink-0 text-sm text-muted-foreground"
            >
              {formatDate(item.publishedAt)}
            </time>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function OutputPage() {
  const { t } = await getT();
  const { talks, articles } = await getOutputItems();
  const emptyLabel = t(DICT.output.empty);

  return (
    <PageShell>
      <section>
        <h2 className="text-lg font-bold">{t(DICT.output.talks)}</h2>
        <div className="mt-4">
          <OutputList items={talks} emptyLabel={emptyLabel} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-lg font-bold">{t(DICT.output.articles)}</h2>
        <div className="mt-4">
          <OutputList items={articles} emptyLabel={emptyLabel} />
        </div>
      </section>
    </PageShell>
  );
}
