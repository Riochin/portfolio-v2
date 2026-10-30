"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Ellipsis,
  Globe,
  ImagePlus,
  LoaderCircle,
  Lock,
  X,
} from "lucide-react";
import type { EditorApi } from "./MilkdownEditor";

/**
 * 記事を書く画面。
 *
 * 見た目はしずかなインターネットに倣う ── 画面には閉じる・保存の状態・公開範囲
 * だけを置き、slug や日付は ⋯ の中に隠す。タイトルは日付を仮の名前にして、
 * 何も決めずに本文から書き始められるようにする。
 *
 * 保存は 2 段:
 * - 端末 (localStorage): 書くたびに自動で。タブを閉じても戻ってくる
 * - 保存先 (dev は作業ツリー、本番は GitHub): 「保存する」か ⌘S で明示的に。
 *   本番は 1 回の保存が 1 commit とビルドになるので、自動にはしない
 *
 * ルートレイアウトの SiteChrome を隠すのではなく、fixed の面で上から覆う。
 * レイアウトはパスを知らずに無条件で描いており、知ろうとすると headers() が
 * 要ってサイト全体が静的プリレンダリングから外れる。
 */

/** エディタは ProseMirror を抱えていて SSR できないので、クライアントだけで読む。 */
const MilkdownEditor = dynamic(() => import("./MilkdownEditor"), {
  ssr: false,
  loading: () => (
    <p className="py-8 text-sm text-muted-foreground">エディタを読み込み中…</p>
  ),
});

export type Doc = {
  readonly slug: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly draft: boolean;
  readonly markdown: string;
};

type Props = {
  /** 保存先にある内容。新規なら既定値 (slug は日付、本文は空)。 */
  doc: Doc;
  /** 開いたときの blob sha。新規なら null。保存時に競合の判定に使う。 */
  sha: string | null;
  /** 既存記事の編集か。slug を変えられるかと、保存後の遷移に使う。 */
  existing: boolean;
  locale: string;
};

/** 端末に残す下書き。 */
type Stored = {
  readonly doc: Doc;
  readonly sha: string | null;
  readonly savedAt: number;
};

type Status =
  | { readonly kind: "idle" }
  | { readonly kind: "saving" }
  | { readonly kind: "error"; readonly message: string };

const storageKey = (existing: boolean, slug: string) =>
  `studio:draft:${existing ? slug : "new"}`;

function readStored(key: string): Stored | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function sameDoc(a: Doc, b: Doc): boolean {
  return (
    a.slug === b.slug &&
    a.title === b.title &&
    a.publishedAt === b.publishedAt &&
    a.draft === b.draft &&
    a.markdown.trim() === b.markdown.trim()
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-10-30" → "10月30日（金）"。タイトルを決めていない記事の仮の名前。 */
function dateTitle(publishedAt: string): string {
  const [year, month, day] = publishedAt.split("-").map(Number);
  if (!year || !month || !day) return publishedAt;
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()] ?? "";
  return `${month}月${day}日（${weekday}）`;
}

/** 本文の文字数。空白と改行は数えない。 */
const countChars = (markdown: string) => markdown.replace(/\s/g, "").length;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** サイト本体の「戻る」リンクと同じ振る舞い。丸い当たり面は作らない。 */
const ICON_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-accent";

/** サイト本体のボタン (作品ページの「編集」など) と同じ外枠。 */
const OUTLINE_BUTTON =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1 text-sm transition-colors";

const noopSubscribe = () => () => {};

export function StudioEditor(props: Props) {
  const key = storageKey(props.existing, props.doc.slug);

  // 端末に下書きが残っていればそちらを開く。localStorage はサーバーに無いので、
  // 判断はクライアントで描く最初の 1 回に行い、サーバーと hydration の間は
  // 何も描かない (ここで localStorage を読むと両者の描画がずれる)。
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const initial = useMemo(() => {
    if (!mounted) return null;
    const stored = readStored(key);
    if (stored && !sameDoc(stored.doc, props.doc)) {
      return { doc: stored.doc, sha: stored.sha, restored: true };
    }
    return { doc: props.doc, sha: props.sha, restored: false };
  }, [mounted, key, props.doc, props.sha]);

  if (initial === null) {
    return <div className="fixed inset-0 z-50 bg-background" />;
  }
  return <Editor key={key} {...props} initial={initial} storageKey={key} />;
}

function Editor({
  initial,
  storageKey: key,
  existing,
  locale,
}: Props & {
  initial: { doc: Doc; sha: string | null; restored: boolean };
  storageKey: string;
}) {
  const router = useRouter();

  const [doc, setDoc] = useState<Doc>(initial.doc);
  const [sha, setSha] = useState(initial.sha);
  /** 最後に保存先と一致した内容。これと違えば未保存。 */
  const [base, setBase] = useState<Doc>(
    initial.restored ? { ...initial.doc, markdown: "\u0000" } : initial.doc,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [restoredNotice, setRestoredNotice] = useState(initial.restored);
  const [menuOpen, setMenuOpen] = useState(false);

  const editorRef = useRef<EditorApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  const dirty = !sameDoc(doc, base);
  const saving = status.kind === "saving";
  /** 自分だけ → 公開に切り替えた保存は、サイトに出る 1 回なので言葉を変える。 */
  const publishing = base.draft && !doc.draft;
  const slugValid = SLUG.test(doc.slug) && doc.slug !== "new";

  const patch = useCallback(
    (part: Partial<Doc>) => setDoc((current) => ({ ...current, ...part })),
    [],
  );

  // 画像アップロードは初回マウント時に閉じ込められた関数から呼ばれるので、
  // その時点の slug ではなく「今の slug」を読めるように ref 経由で渡す。
  const slugRef = useRef(doc.slug);
  useEffect(() => {
    slugRef.current = doc.slug;
  }, [doc.slug]);
  const getSlug = useCallback(() => slugRef.current.trim(), []);

  const onReady = useCallback((api: EditorApi) => {
    editorRef.current = api;
  }, []);
  const onChange = useCallback(
    (markdown: string) => patch({ markdown }),
    [patch],
  );
  const onError = useCallback(
    (message: string) => setStatus({ kind: "error", message }),
    [],
  );

  // 端末への自動保存。打鍵のたびに書くと重いので少し待つ。
  // 保存先と一致したら消す ── 次に開いたときに「下書きを復元」が出ないように。
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (dirty) {
          const stored: Stored = { doc, sha, savedAt: Date.now() };
          window.localStorage.setItem(key, JSON.stringify(stored));
        } else {
          window.localStorage.removeItem(key);
        }
      } catch {
        // 容量超過やプライベートモード。自動保存が効かないだけで書き続けられる。
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [doc, sha, dirty, key]);

  // タイトル欄は 1 行から始めて、長くなったら伸ばす。
  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [doc.title]);

  const save = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!slugValid) {
      setStatus({
        kind: "error",
        message: "slug は小文字英数とハイフンだけにしてください (⋯ から直せます)",
      });
      setMenuOpen(true);
      return;
    }

    // タイトルを決めていなければ日付を名前にする (しずかなインターネットと同じ)。
    const title = doc.title.trim() || dateTitle(doc.publishedAt);
    const markdown = editor.getMarkdown();
    const sending: Doc = { ...doc, title, markdown };

    // 409 のときに自分を呼び直すので、useCallback の外側ではなくここで名前を持つ。
    const submit = async (overwrite: boolean): Promise<void> => {
      const response = await fetch("/studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sending, sha, overwrite }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        sha?: string;
        error?: string;
        code?: "exists" | "changed" | "missing";
      };

      if (response.status === 409) {
        const question =
          payload.code === "exists"
            ? `${sending.slug} は既にあります。上書きしますか?`
            : payload.code === "missing"
              ? "開いてから記事が消されています。書き直しますか?"
              : "開いてから別の場所で書き換えられています。上書きしますか?";
        if (window.confirm(question)) {
          await submit(true);
        } else {
          setStatus({ kind: "error", message: "保存を中止しました" });
        }
        return;
      }
      if (!response.ok || !payload.sha) {
        setStatus({
          kind: "error",
          message: payload.error ?? "保存できませんでした",
        });
        return;
      }

      setDoc(sending);
      setBase(sending);
      setSha(payload.sha);
      setStatus({ kind: "idle" });
      setRestoredNotice(false);
      try {
        window.localStorage.removeItem(key);
      } catch {
        // 消せなくても次に開いたときに内容が同じなら復元は出ない。
      }

      // 一覧と本文ページが読み直せるように、サーバー側の描画を捨てる。
      router.refresh();
      if (!existing) {
        router.replace(`/${locale}/studio/${sending.slug}`);
      }
    };

    setStatus({ kind: "saving" });
    try {
      await submit(false);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "保存できませんでした",
      });
    }
  }, [doc, sha, slugValid, key, existing, locale, router]);

  // ⌘S / Ctrl+S でも保存する。書いている最中にブラウザの保存ダイアログを出さない。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (dirty && !saving) void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, dirty, saving]);

  const pickImage = () => fileInputRef.current?.click();
  const onFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editorRef.current) return;
    try {
      await editorRef.current.insertImage(file);
    } catch (error) {
      if (error instanceof Error) onError(error.message);
    }
  };

  const discardDraft = () => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 消せなければ再読み込みでまた復元されるだけ。
    }
    window.location.reload();
  };


  return (
    <div className="studio-editor fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 bg-background/90 px-2 backdrop-blur-md sm:px-4">
        <Link
          href={`/${locale}/studio`}
          className={ICON_BUTTON}
          aria-label="一覧に戻る"
          title="一覧に戻る"
        >
          <X size={20} />
        </Link>

        <div className="flex items-center gap-1">
          {/* 未保存のときだけ塗る。塗りはナビの現在地と同じ bg-accent。 */}
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
            className={`${OUTLINE_BUTTON} font-medium ${
              dirty
                ? "border-accent bg-accent text-white hover:opacity-90 dark:text-background"
                : "border-border text-muted-foreground"
            } disabled:cursor-default`}
          >
            {saving ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                保存中
              </>
            ) : dirty ? (
              publishing ? "公開" : "保存"
            ) : (
              <>
                <Check size={14} />
                保存済み
              </>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={ICON_BUTTON}
              aria-label="公開範囲・slug・日付"
              aria-expanded={menuOpen}
            >
              <Ellipsis size={20} />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="閉じる"
                  className="fixed inset-0 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-10 w-72 rounded-xl border border-border bg-surface p-4">
                  {/* 公開範囲。frontmatter の draft をそのまま裏返したもの。 */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!doc.draft}
                    onClick={() => patch({ draft: !doc.draft })}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="block">
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
                        {doc.draft ? <Lock size={16} /> : <Globe size={16} />}
                        {doc.draft ? "自分だけ" : "公開"}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {doc.draft ? "一覧と sitemap に出ない" : "一覧に出る"}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`relative h-5 w-9 shrink-0 rounded-xl border transition-colors ${
                        doc.draft
                          ? "border-border bg-background"
                          : "border-accent bg-accent"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-3.5 w-3.5 rounded-xl transition-[left] ${
                          doc.draft
                            ? "left-0.5 bg-muted-foreground"
                            : "left-[1.125rem] bg-white dark:bg-background"
                        }`}
                      />
                    </span>
                  </button>

                  <label className="mt-4 block">
                    <span className="block text-xs font-bold text-muted-foreground">
                      slug (URL とファイル名)
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm disabled:opacity-60"
                      value={doc.slug}
                      onChange={(event) =>
                        patch({ slug: event.target.value.trim() })
                      }
                      disabled={existing}
                      spellCheck={false}
                      autoCapitalize="off"
                    />
                    {existing && (
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                        変えたいときは git mv で (画像の置き場も一緒に動かすため)
                      </span>
                    )}
                  </label>
                  <label className="mt-3 block">
                    <span className="block text-xs font-bold text-muted-foreground">
                      公開日
                    </span>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      value={doc.publishedAt}
                      onChange={(event) =>
                        patch({ publishedAt: event.target.value })
                      }
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {(status.kind === "error" || restoredNotice) && (
        <div className="mx-auto w-full max-w-[44rem] px-6 pt-3">
          {status.kind === "error" && (
            <p className="text-sm text-[#e05252]">{status.message}</p>
          )}
          {restoredNotice && (
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
              この端末に残っていた下書きを開きました。
              <button
                type="button"
                onClick={discardDraft}
                className="underline underline-offset-4 hover:text-foreground"
              >
                捨てて開き直す
              </button>
            </p>
          )}
        </div>
      )}

      <main className="mx-auto w-full max-w-[44rem] px-6 pb-40 pt-10 sm:pt-20">
        <textarea
          ref={titleRef}
          rows={1}
          value={doc.title}
          onChange={(event) =>
            patch({ title: event.target.value.replace(/\n/g, "") })
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder={dateTitle(doc.publishedAt)}
          className="block w-full resize-none overflow-hidden bg-transparent text-2xl font-bold leading-snug outline-none placeholder:text-muted-foreground/60"
          aria-label="タイトル"
        />

        <div className="mt-6">
          <MilkdownEditor
            defaultValue={initial.doc.markdown}
            placeholder="本文を書く"
            getSlug={getSlug}
            onReady={onReady}
            onChange={onChange}
            onError={onError}
          />
        </div>
      </main>

      {/* 文字数と画像。dev で左下に出る Next のインジケータは next.config.ts で右下に逃がしてある。 */}
      <div className="fixed bottom-4 left-4 flex items-center gap-2 rounded-xl bg-background/90 pr-1 backdrop-blur-sm">
        <span
          className="rounded-xl border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
          title="本文の文字数"
        >
          {countChars(doc.markdown)}
        </span>
        <button
          type="button"
          onClick={pickImage}
          className={ICON_BUTTON}
          aria-label="画像を入れる"
          title="画像を入れる"
        >
          <ImagePlus size={18} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void onFilePicked(event)}
      />
    </div>
  );
}
