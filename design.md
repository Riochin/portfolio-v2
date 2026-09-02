# design.md — riochin.dev v2 デザインメモ

技術選定・デザインの意思決定ログ。実装前の議論をベースにした「決定事項」を記録する。迷ったらここに立ち返る。

## コンセプト

トップページ中央に丸みのある画像ブロックを置き、そこに青空/星空(ライト/ダークモードで切り替え)を表示する。クリックすると画面全体にWebGLの青空/星空演出が広がる。クリックまでは「2D感のある静止画」に見せることが重要 — WebGLはコストが高いので初期表示では使わない。

## レイアウト(デスクトップ)

```
[左: ナビ]                                  [右: SNSアイコン縦並び]
About me
Works                    [中央: 角丸ブロック]
Experience                  背景: 青空/星空写真
Output                      中央: 筆記体ロゴ "Riochin"
                             (クリックでWebGL全画面へ)
© 2026 Riochin.

                    [下部中央: テーマ切替(月/太陽アイコン)]
```

- 左ナビ、右SNSアイコンは画面端に固定配置
- SNSアイコン: GitHub, X, Speaker Deck, LinkedIn, Zenn
- `/contact` は作らない(SNSアイコンで代替)

## レイアウト(モバイル)

- ハンバーガーメニューでナビ + SNSアイコンをまとめる
- 中央ブロックはそのまま(タップでWebGL全画面、`prefers-reduced-motion` 時は静止画のまま)

## 多言語 (i18n)

日英両対応。`/ja/...` `/en/...` のパスルーティングで、全ページを `src/app/[lang]/` 配下に置く。デフォルトは `ja`。

- ロケールの解決は `next/root-params` の `lang()`。ルートレイアウトが `app/[lang]/layout.tsx` にあるので、任意の Server Component から prop drilling なしに読める。使用箇所は `src/lib/i18n/server.ts` 1 ファイルに閉じる
- Client Component / Route Handler では `root-params` が使えない。前者はサーバーで解決した値を props で渡し、後者(OG 画像)は `params` から `lang` を受け取る
- 接頭辞なしのパスは `src/proxy.ts` が 307 リダイレクト。`NEXT_LOCALE` cookie → `Accept-Language` → `ja` の優先順。2 ロケールなのでネゴシエーション用のライブラリは入れず自前で持つ
- `alternates.languages` で hreflang (ja / en / x-default) を全ページに出す

## ルーティング / IA

| ルート | 内容 |
|---|---|
| `/about` | About me |
| `/works` | 制作物(ハッカソン作品など、プロジェクト単位)。上部に作品横断の受賞一覧 |
| `/works/[slug]` | 作品の詳細。本文・受賞・技術スタック・関連 Experience。作品ごとに OGP 生成 |
| `/experience` | 経験(インターンなど、所属単位) |
| `/output` | 登壇(SpeakerDeck) + 記事(Zenn/Qiita/自前)の統合一覧。登壇が主戦場なので登壇を上位表示 |
| `/blog/[slug]` | 自前記事の本文。一覧は持たず、`/output` の「書いた記事」から入る |
| `/studio`, `/studio/[slug]` | 記事を書く開発専用の画面。本番では 404 |

`/contact` なし。`/output` は当初 `/articles` を検討したが、登壇 > 執筆という実態に合わせて改名。

自前記事の一覧は `/blog` に作らず `/output` に混ぜる。ナビ項目は 4 つのままで、読み手から見ると「書いたもの」は媒体を問わず 1 箇所にある。本文だけ `/blog/[slug]` に置くのは、将来 `/output` から切り出したくなったときに URL を動かさずに済ませるため。

### Works と Experience の関係

作品単位(Works)と所属単位(Experience)は軸が違うため独立させる。ハッカソン作品がインターン中に生まれた場合など、関連付けたいケースがあるので Works 側に `relatedExperience` 参照フィールドを持たせる。

データは `src/data/*.ts` に TS モジュールとして持つ。レコードは配列ではなく **キー付きオブジェクト + `as const satisfies`** で書き、キーがそのまま slug になる。これにより `WorkSlug` / `ExperienceSlug` / `SkillSlug` が literal union になり、`relatedExperience` と `stack` の参照整合が型で保証される。

```ts
// src/data/types.ts
type WorkEntry = {
  title: Localized<string>;
  tagline: Localized<string>;              // 一覧の1行説明
  body: readonly Localized<string>[];      // 詳細ページの本文(段落ごと)
  period: Period;                          // { start: YearMonth; end: YearMonth | null }
  role?: Localized<string>;
  stack: readonly SkillSlug[];             // 自由文字列ではなく skills マスタへの参照
  links: { repo?; demo?; article?; slides? };
  image?: ImageRef;                        // { src, width, height, alt: Localized<string> }
  awards?: readonly Award[];               // { event, prize, rank, sponsor?, date }
  relatedExperience?: ExperienceSlug;
  featured?: boolean;
};

type ExperienceEntry = {
  organization: Localized<string>;
  position: Localized<string>;
  period: Period;
  highlights: readonly Localized<string>[];
  kind: "education" | "internship" | "program";
  stack?: readonly SkillSlug[];
  url?: string;
};
```

設計上の約束:

- **`Localized<T>` は必ず葉に置く。** `readonly Localized<string>[]` であって `Localized<readonly string[]>` ではない。後者だと EN/JA で要素数がずれても型が通ってしまう(旧サイトの実害)。
- **日付は `YearMonth` (`"2025-06"`)。** ゼロ埋めなので文字列比較でソートでき、`end: null` が「継続中」を表す。表示は `formatPeriod()` が `2025.6 – 現在` / `2025.6 – Present` に整形する。
- **`src/data/` に React コンポーネントを置かない。** アイコンはスラッグ文字列だけ持ち、key → コンポーネントの対応はコンポーネント側 (`SocialLinks.tsx` / `SkillIcon.tsx`) に置く。データをシリアライズ可能に保ち Server → Client 境界を越えられるようにするため。
- **並び替え・フィルタは `src/data/index.ts` のアクセサ層だけ**に置く。アクセサは同期かつロケール非依存 ── `opengraph-image.tsx` は Route Handler 扱いで `next/root-params` を使えないので、ここがロケールを知っていると OG 画像から呼べなくなる。
- **アイデンティティ情報の単一の情報源は `src/data/site.ts`。** 名前・ブランド・外部サービスのユーザー名・ナビのパスはここだけにあり、`src/lib/output/config.ts` もここを読む。UI 文言は `src/lib/i18n/dictionary.ts`。

### Output のデータソース

外部サービスからビルド時 fetch + ISR revalidate で集約する(クライアントfetchはCORSの壁があるため不採用)。

- SpeakerDeck: `https://speakerdeck.com/{user}.atom` (Atomフィード)
- Zenn: `https://zenn.dev/{user}/feed` (RSS)
- Qiita: 公開API v2 `GET /api/v2/items?query=user:{user}`

## カラーパレット

各モードのアクセントカラーは、写真から拾った色を採用する方針(ブランドカラーを固定で置かない)。

### Light mode

| トークン | 値 | 用途 |
|---|---|---|
| background | `#FBF3F5` | ページ背景(淡いラベンダー寄りの白) |
| card / surface | `#FFFFFF` | 中央ブロックなどのカード面 |
| border | `#E4D9DD` | 境界線 |
| foreground | `#171717` | 本文テキスト |
| muted foreground | `#6B6560` | 補助テキスト(コピーライトなど) |
| accent | `#3D8FD9` | 青空の青。リンクやアイコンのアクセント |

### Dark mode

| トークン | 値 | 用途 |
|---|---|---|
| background | `#07070F` | ページ背景(ほぼ黒に近い紺) |
| card / surface | `#12121F` | 中央ブロックなどのカード面 |
| border | `#23233A` | 境界線 |
| foreground | `#F5F5F5` | 本文テキスト |
| muted foreground | `#8B8B99` | 補助テキスト |
| accent | `#8B7EF0` | 天の川の紫。リンクやアイコンのアクセント |

> 実際のモック画像ファイルを共有できれば、ドミナントカラー抽出で数値を精緻化する。

## タイポグラフィ

- 本文: **Zen Maru Gothic**
- ロゴ("Riochin"表記): cursive系フォント(モックの筆記体を踏襲。具体的なGoogle Fontsは未確定)

## WebGL演出

- **実装**: React Three Fiber + `@react-three/drei` の `<Sky>`(Preetham大気モデル、ライト用)と `<Stars>`(プロシージャル星空、ダーク用)をベースにする
- **ロード**: `next/dynamic({ ssr: false })` でCanvasを遅延ロードし、初期表示のバンドルに含めない
- **遷移**: 中央ブロック → 全画面のモーフは Framer Motion の shared layout animation (`layoutId`) で実装
- **モバイル**: PCと同じくフル対応(デバイスで演出を制限しない)
- **アクセシビリティ**: `prefers-reduced-motion: reduce` を検知したら静的な星空/青空表示にフォールバックする(パーティクルアニメーションによる眩暈対策)

## SEO / OGP

- ページごとに `next/og` で動的生成(固定画像は使わない)。作品詳細は作品タイトル入りの OGP を slug × ロケールで事前生成する
- `sitemap.ts` は全ページ × 全ロケールを hreflang alternates 付きで出力する。`robots.ts` は開発用の `/hero-capture` を除外する

## アナリティクス

- 初期実装では計測コードを入れない
- 後で `next/third-parties` の `<GoogleAnalytics />` を差し込めるよう、レイアウトに計測コンポーネントを足すだけで済む構成にしておく

## デプロイ

- Vercel、通常デプロイ(SSR/RSC活用、`output: export` は使わない)
- ドメイン: riochin.dev

## 記事 (自前コンテンツ)

`/studio` で書き、`content/articles/<slug>.md` として残る。commit してデプロイすると公開される。

### 情報源を TS ではなく Markdown にした

作品・経歴は構造が決まっているので `src/data/*.ts` が最適だが、記事は長文の地の文で、TS の文字列リテラルに入れるとエスケープと 1 ファイルの肥大に耐えられない。Markdown なら `git diff` が人間に読め、Zenn / Qiita への転載もコピペで済む。

- frontmatter は `title` / `publishedAt` / `draft` の 3 つだけ。`cover` は作らない (サムネイルは後述の OG 画像で足りる)、`tags` も作らない (描画する場所が無い)
- 読み取りは `src/lib/articles/`。**`src/data/index.ts` と同じく同期・ロケール非依存**を守る ── `opengraph-image.tsx` は Route Handler 扱いで `next/root-params` を使えないため
- キャッシュは本番だけ。`.md` は誰も import しないのでバンドラのグラフに載らず、dev で覚えると studio で保存しても一覧が古いまま張り付く

### 記事だけ日本語単言語にした

`Localized<T>` を葉に置く約束の唯一の例外。作品の tagline は 1 行なので日英を揃えられるが、記事は訳す負荷が執筆そのものを止める。`/output` に並ぶ Zenn / Qiita の記事も日本語なので、`/en` でそのまま出しても不揃いにならない (印も付けない)。

### `outputFileTracingIncludes` が要る

`/output` は完全な静的ページではない。`lib/output/*` の per-fetch `revalidate: 3600` がページに伝播していて、`prerender-manifest.json` 上も `initialRevalidateSeconds: 3600` の ISR になっている。つまり**デプロイの 1 時間後にサーバー上で再レンダリングされ、そこで `.md` を読む**。`@vercel/nft` は `join(process.cwd(), "content", "articles")` を追えないので、`next.config.ts` で明示的に同梱しないと、ビルドもデプロイ直後も正常なのに 1 時間後に `/output` だけが 500 になる。

`/blog/[slug]` では `public/articles/**` も同梱する。本文の画像の寸法をビルド時に実ファイルから読む (`rehypeImageSize`) ためで、寸法を Markdown 側に書かないので画像を差し替えても数字が古くならない。

`dynamicParams` は固定しない。未知の slug は記事が引けず `notFound()` に落ちるだけなので実行時レンダリングを塞ぐ必要が無く、逆に `false` にすると `generateStaticParams` の結果が再コンパイルまで据え置かれて、studio で保存した直後の数秒間だけ書いたばかりの記事が 404 になる。

### エディタに Milkdown (Crepe) を選んだ

Markdown を情報源にする以上、**開いて保存しただけで本文が変質しないこと**が要件になる。Milkdown は内部表現が remark そのものなので、これを満たす。

- `tiptap-markdown` は 0.9.0 で最終更新が 1 年前 (本体は 3.x)。橋渡しが古すぎる
- `@blocknote/core` は Markdown 変換が公式に lossy と明記されている
- 素の `@milkdown/kit` は採らない。`plugin-block` / `plugin-slash` は `content: HTMLElement` を要求するヘッドレスな配置機構でしかなく、ドラッグハンドルもスラッシュメニューの中身も自前になる。Vue が依存に入るのは kit でも同じ (`@milkdown/components` 経由) なので、Crepe を避けても減らない
- `remarkStringifyOptionsCtx` で箇条書きと水平線を `-` に寄せる。既定の `*` のままだと、手書きのファイルを一度開くだけで全行が書き換わって diff が汚れる
- エディタは `devDependencies`。dev 専用ルートでしか読まないので本番の依存には出さない

### studio の作りは hero-capture に倣う

本番では素の 404 を返し、認証は持たない。書き込み先はリポジトリの作業ツリーで、著者が `git diff` で確かめて commit する (Vercel の実行時ファイルシステムは読み取り専用なので、この作りは本番に持ち上がらない)。

- 保存口は `[lang]` の外 (`/studio/save`, `/studio/upload`)。Route Handler では `root-params` が使えないため。`proxy.ts` の matcher でも素通しにする ── リダイレクトされると 307 がメソッドを保って `/ja/studio/save` へ POST し直され 404 になる
- 改名は実装しない。`public/articles/<slug>/` の画像も一緒に動かす必要があるので `git mv` に任せる
- `SiteChrome` は studio でも隠さない。ルートレイアウトの Server Component が無条件に描いており、パスを知るには `headers()` が要る ── サイト全体が静的プリレンダリングから外れてしまう

### 記事の OG 画像

他のページの OG がワードマークを中央に据えた「表紙」なのに対し、記事は Zenn / Qiita のカードに構造を寄せる (外枠 → 白いカード → 左上に見出し → 下辺に名乗り)。`/output` の一覧ではこの画像が Zenn / Qiita のサムネイルと**同じグリッドに並ぶ**ので、作りが揃っていないとそこだけ浮くため。1200x630 なので既存の `aspect-[1200/630]` ともそのまま揃う。

中のカードはサイトの面の色 (`--surface` の白)。記事本文のコードブロックも同じ白に揃えてあるので、共有された画像から記事に入ったときに面の色が変わらない。

枠は上がダークの地色 (`#070d1e` 夜空の紺)、下がダークのアクセント (`#8b7ef0` 天の川の紫) の縦グラデーション。紺を 48% まで厚く取ってから紫へ落とす ── 中点を上げると紫が支配的になり、夜空ではなく紫のカードに見える。**青から紫へ渡すグラデーションは採らない。Zenn のカードそのものになる**ため、同じ理由でカードの面も検討した (下記)。

枠の帯には星を撒く。ダークモードのヒーローが星空なので、OG でも同じ題材を出す。乱数は固定の種で回して決定的にしてある ── ビルドのたびに配置が変わると、記事ごとに違う空になって「同じサイトのカード」に見えなくなる。カードに隠れる内側の座標は捨てて帯の中にだけ置き、角が丸いぶん四隅だけ自然に濃くなる。

名乗りの前にはプロフィール写真を丸く置く。satori は webp を解せない (渡すと "not iterable" で落ちる) ので、`public/profile-og.png` に PNG の複製を持ち、`next.config.ts` でサーバー側のバンドルにも同梱する。`borderRadius` を img に直接掛けても satori は角を落とすだけなので、丸く切り抜いた入れ物に入れる。

見出しは 4 行で打ち切って `…` を足す。satori は `-webkit-line-clamp` を解さないので、字幅を仮定して JS 側で切り、`maxHeight` を行の高さの整数倍にして 5 行目が半分覗くのを防ぐ。

### 本文のスタイルは手書き

`@tailwindcss/typography` は入れない。要素の文字サイズを rem 直書きで決めるので、本文を 18px に持ち上げてあるこのサイトでは記事の中だけ 16px ベースラインに戻ってしまう。色も `--tw-prose-*` を 6 つのトークンに繋ぎ直すことになり、`globals.css` の `.article-body` に 20 行ほど書くのと変わらない。

### コードブロックの色

shiki で**ライトとダークの 2 つを同時に焼く**。色は `--shiki-light` / `--shiki-dark` として両方 HTML に載り (`defaultColor: false`)、切り替えは `globals.css` の `.dark` が行う ── 実行時の再変換も、クライアントへ送る JS も要らない。

- ダークは **Dracula**
- ライトは **rose-pine-dawn**。基本の文字が紫 (`#575279`)、キーワードが青 (`#286983`)、関数がピンク (`#b4637a`) と、このサイトのアクセントの取り合わせにそのまま乗る。catppuccin-latte も比べたが、キーワードが橙・文字列が緑になるので採らなかった
- ただし**背景だけはテーマの値を使わない**。rose-pine-dawn の地色 `#faf4ed` は暖色寄りで、ページの `#fbf3f5` に置くとそこだけ黄みがかって見える。サイトの `--surface` に差し替え、他のカードと同じく `--border` の枠を添える。ダークは Dracula の地色をそのまま使う (あの配色は自前の暗い面を前提に作られている)

`react-markdown` は同期版の `<Markdown>` ではなく `MarkdownAsync` を使う。shiki の rehype プラグインが非同期で、同期版は内部で `runSync()` を呼ぶため例外になる。

言語定義は `shiki` の既定 bundle (8MB 超) を丸ごと積まず、core に 13 言語だけ明示的に積む。正規表現エンジンも WASM (oniguruma) ではなく JS 実装を `forgiving` で使う。

エディタ側の CodeMirror も同じ 2 つに揃える。ライト用の rose-pine-dawn は CodeMirror 向けの実装が無いので、同じ配色を `createTheme` で張り直した (`src/components/studio/rosePineDawnCodeMirror.ts`)。判定はマウント時の 1 回きり ── 差し替えには Compartment が要るが、書いている途中にテーマを切り替えるのは稀なので持ち込まない。

### studio の見た目

Crepe の既定テーマ (frame) はサイトのトークンに繋ぎ替える (`src/components/studio/milkdown-theme.css`)。書く画面と公開後の見た目が違うと、書きながら仕上がりを判断できない。

- 既定の書体は Noto Serif / Noto Sans。見出しも本文も **Zen Maru Gothic** に差し替える
- 本文は 18px。サイト本体の `--text-base` と同じにして、書いている最中と公開後の行長を揃える
- `--crepe-color-*` は全て `--background` / `--surface` / `--border` / `--foreground` / `--muted-foreground` / `--accent` に繋ぐ。これらは `globals.css` が `:root` と `.dark` の両方で定義しているので、テーマ切替には何も足さずに追随する
- ホバーと選択は `color-mix` でアクセントを透過で被せる。地の色が明暗で入れ替わっても被せ方は変わらない
- `globals.css` ではなく専用ファイルに置くのは、studio が dev 専用の道具だから。テーマ CSS の**後**に読ませ、セレクタも `.milkdown` の中に閉じてある
