---
title: "このサイトに記事を書けるようにした"
publishedAt: "2026-09-03"
draft: false
---

ポートフォリオのコンテンツはこれまで全部 `src/data/*.ts` に直書きしていた。作品や経歴のように構造が決まっているものはそれでよかったけれど、文章を書く場所が無かった。

## やったこと

`npm run dev` のときだけ開ける編集画面を用意して、書いたものを `content/articles/` に Markdown として落とすようにした。

- ブロックエディタなので Markdown の記法を覚えなくていい
- 保存すると普通のファイルになるので、`git diff` で読める
- 画像はドラッグで置ける

## 仕組み

保存口は本番では 404 を返す。ヒーローの静止画を焼く `/hero-capture` と同じ作りで、認証もデータベースも足していない。

```ts
if (process.env.NODE_ENV === "production") {
  return new NextResponse(null, { status: 404 });
}
```

書いたら commit して push する。それがそのまま公開になる。
