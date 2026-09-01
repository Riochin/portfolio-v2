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

## ルーティング / IA

| ルート | 内容 |
|---|---|
| `/about` | About me |
| `/works` | 制作物(ハッカソン作品など、プロジェクト単位) |
| `/experience` | 経験(インターンなど、所属単位) |
| `/output` | 登壇(SpeakerDeck) + 記事(Zenn/Qiita)の統合一覧。登壇が主戦場なので登壇を上位表示 |

`/contact` なし。`/output` は当初 `/articles` を検討したが、登壇 > 執筆という実態に合わせて改名。

### Works と Experience の関係

作品単位(Works)と所属単位(Experience)は軸が違うため独立させる。ハッカソン作品がインターン中に生まれた場合など、関連付けたいケースがあるので Works 側に `relatedExperience` 参照フィールドを持たせる(未実装、必要になったら追加)。

```ts
// works の想定フィールド
{ title, period, description, role, stack: string[], links: { repo?, demo?, article? }, image?, relatedExperience?: string }

// experience の想定フィールド
{ organization, position, period, description, stack?: string[] }
```

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

- ページごとに `next/og` で動的生成(固定画像は使わない)

## アナリティクス

- 初期実装では計測コードを入れない
- 後で `next/third-parties` の `<GoogleAnalytics />` を差し込めるよう、レイアウトに計測コンポーネントを足すだけで済む構成にしておく

## デプロイ

- Vercel、通常デプロイ(SSR/RSC活用、`output: export` は使わない)
- ドメイン: riochin.dev
