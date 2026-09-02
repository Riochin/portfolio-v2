"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { EditorApi } from "./MilkdownEditor";

/**
 * エディタは ProseMirror を抱えていて SSR できないので、クライアントだけで読む。
 * ssr: false は Client Component の中でしか書けない (Server Component では不可)。
 */
const MilkdownEditor = dynamic(() => import("./MilkdownEditor"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-sm text-muted-foreground">エディタを読み込み中…</p>
  ),
});

type Props = {
  /** 新規なら空。既存記事の編集なら固定 (このツールでは改名しない)。 */
  slug: string;
  title: string;
  publishedAt: string;
  draft: boolean;
  markdown: string;
  /** 既存記事の編集か。保存時に上書きしてよいかの判断に使う。 */
  existing: boolean;
  /** 保存後の遷移先を組み立てるためのロケール接頭辞。 */
  locale: string;
};

const FIELD =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm";
const LABEL = "block text-xs font-bold text-muted-foreground";

export function StudioEditor(props: Props) {
  const router = useRouter();

  const [slug, setSlug] = useState(props.slug);
  const [title, setTitle] = useState(props.title);
  const [publishedAt, setPublishedAt] = useState(props.publishedAt);
  const [draft, setDraft] = useState(props.draft);
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<EditorApi | null>(null);

  // 画像アップロードは初回マウント時に閉じ込められた関数から呼ばれるので、
  // その時点の slug ではなく「今の slug」を読めるように ref 経由で渡す。
  const slugRef = useRef(slug);
  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);
  const getSlug = useCallback(() => slugRef.current.trim(), []);

  const onReady = useCallback((api: EditorApi) => {
    editorRef.current = api;
  }, []);

  const save = useCallback(
    async (overwrite: boolean) => {
      const editor = editorRef.current;
      if (!editor) {
        setStatus("エディタがまだ準備できていません");
        return;
      }

      // 409 のときに自分を呼び直すので、useCallback の外側ではなくここで名前を持つ。
      const submit = async (over: boolean): Promise<void> => {
        const response = await fetch("/studio/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slug.trim(),
            title: title.trim(),
            publishedAt,
            draft,
            markdown: editor.getMarkdown(),
            overwrite: over,
          }),
        });
        const payload = (await response.json()) as {
          path?: string;
          error?: string;
        };

        if (response.status === 409) {
          // 新規のつもりが既にあった。踏み潰す前に必ず聞く。
          if (window.confirm(`${slug}.md は既にあります。上書きしますか?`)) {
            await submit(true);
            return;
          }
          setStatus("保存を中止しました");
          return;
        }
        if (!response.ok) {
          setStatus(payload.error ?? "保存できませんでした");
          return;
        }

        setStatus(`保存しました → ${payload.path}`);
        // 一覧と本文ページが読み直せるように、サーバー側の描画を捨てる。
        router.refresh();
        if (!props.existing) {
          router.replace(`/${props.locale}/studio/${slug.trim()}`);
        }
      };

      setSaving(true);
      setStatus("保存中…");
      try {
        await submit(overwrite);
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "保存できませんでした",
        );
      } finally {
        setSaving(false);
      }
    },
    [slug, title, publishedAt, draft, props.existing, props.locale, router],
  );

  // ⌘S / Ctrl+S でも保存する。書いている最中にブラウザの保存ダイアログを出さない。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void save(props.existing);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, props.existing]);

  return (
    <div>
      {/* slug はエディタより上に置く。画像のアップロード先が slug で決まるので、
          本文を書き始める前に必ず目に入る位置でなければならない。 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>slug (URL とファイル名)</span>
          <input
            className={`${FIELD} mt-1 font-mono disabled:opacity-60`}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            disabled={props.existing}
            placeholder="hello-world"
            spellCheck={false}
          />
        </label>

        <label className="block">
          <span className={LABEL}>公開日</span>
          <input
            type="date"
            className={`${FIELD} mt-1`}
            value={publishedAt}
            onChange={(event) => setPublishedAt(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className={LABEL}>タイトル</span>
        <input
          className={`${FIELD} mt-1`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="記事のタイトル"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft}
            onChange={(event) => setDraft(event.target.checked)}
          />
          下書き (一覧と sitemap から外す)
        </label>

        <button
          type="button"
          onClick={() => void save(props.existing)}
          disabled={saving}
          className="rounded-xl border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          保存 (⌘S)
        </button>

        {status !== "" && (
          <span className="text-xs text-muted-foreground">{status}</span>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface">
        <MilkdownEditor
          defaultValue={props.markdown}
          getSlug={getSlug}
          onReady={onReady}
          onError={setStatus}
        />
      </div>
    </div>
  );
}
