---
name: push-and-pr
description: このブランチのコミットを origin に push して、main への Pull Request を作る。「push して PR 作って」「PR 出して」「そろそろ上げて」「この回をまとめて PR に」のように、作業が一区切りして GitHub に上げる話が出たら必ずこの skill を使う。PR 本文をこのリポジトリの型 (導入 → やったこと → 確認) で書き、gh pr edit が壊れている件などの地雷も避ける。PR 本文だけを直したいときにもこの skill の「あとから本文を直す」を読む。
---

# push して PR を作る

このリポジトリの PR は、差分の要約ではなく **次に触る人がやり直さずに済むための記録** として書かれている。
判断の理由と実測値が本文に残っていることが本体で、構成はそのための器にすぎない。
だから作業の重心は「push する」ことではなく「差分を読み直して本文を書く」ことにある。時間の 8 割はそこに使う。

## 1. 前提を確かめる

```bash
git branch --show-current && git status --short && git fetch -q origin main && git log --oneline origin/main..HEAD
```

- **`main` に居たら止まる。** このリポジトリの PR は必ず作業ブランチ → `main`。
- **`origin/main..HEAD` が空なら止まる。** 上げるものが無い。
- **未コミットの変更があったら、コミットせずにユーザーへ聞く。**
  勝手に `git commit` しない決まりで、しかもユーザーは同じリポジトリで並行して編集・`git add` している。
  「これも入れる? それとも今あるコミットだけ上げる?」と一言確認してから進む。

## 2. 差分を読む

本文を書く前に、上げるコミットの中身を全部読む。要約から要約を作ると、理由も数字も落ちる。

```bash
git log --format='%h %s' origin/main..HEAD
git show --stat <sha>        # コミットごとに
git diff origin/main...HEAD  # 全体を通しで
```

同時に、直近の PR を 1 本読んで語り口を合わせる。型は下に書いてあるが、実物を見ないと文の呼吸が合わない。

```bash
gh pr list --limit 5 --json number,title -q '.[] | "\(.number)\t\(.title)"'
gh pr view <n> --json body -q .body
```

会話の中に、採らなかった案・測った数値・ユーザーからの指摘が残っているはずなので、それも拾う。
**本文の価値はほぼここで決まる。**diff だけからは「なぜそうしたか」が出てこない。

## 3. 検証を走らせる

```bash
make typecheck && make lint
```

結果は数字ごと「確認」に書く。通ったなら通ったと、落ちたならその内容を。
`make check` は `build` まで含むが、dev サーバーが 3000 番で動いていると `.next` を奪い合うので既定では走らせない。
ビルドまで見たいときは `next.config.ts` に `distDir: process.env.VERIFY_DIST_DIR ?? ".next"` を一時的に差し込んで
`VERIFY_DIST_DIR=.next-verify pnpm build` で逃がし、**差し込みの戻し・`tsconfig.json` の `git checkout`・`.next-verify` の削除**まで必ずやる。

ブラウザで見ていないものがあるなら、隠さず「確認」にそう書く。嘘が無いことがこの本文の値打ちになっている。

## 4. 本文を書く

本文はリポジトリの外に書く。プロジェクト内に `body.md` を作ると、ユーザーの差分に紛れる。
セッションのスクラッチパッドがあればそこへ、無ければ `BODY=$(mktemp)` でよい。

**タイトル** — ブランチ名に合わせる。`ver1.7.9` のようなブランチなら `ver1.7.9: <日本語の一言>`、
`blog/...` のようなブランチなら接頭辞を付けず素の一文 (例: `記事の語尾をそろえ、締めに一言足す`)。

**本文の型** — #8〜#18 で固まっている。新しい構成を発明しない。

```markdown
<見出し無しの導入 1 段落。この回が何をした回かを一言で。コミット数・触ったファイル数も添える。
 前の PR の続きなら [#17](https://github.com/Riochin/portfolio-v2/pull/17) の形で頭に置く>

## やったこと

### <コミットの題> (<短縮 sha>)

<そのコミットで何を、なぜそうしたか。1 コミット 1 節>

## つくり

<新しいファイルやフックを足したときだけ。無ければ節ごと省く>

## 確認

<tsc --noEmit と eslint の結果、実測した数値の出どころ、まだ実機で見ていないもの。
 見ていないものがあるなら「プレビューで一度触って確かめてほしい」で閉じる>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**書きぶり**

- 箇条書きに逃げず、地の文で理由から書く。**要点は太字**にする
- 測った数値は必ず本文に入れる。`667 個 → 43 個`、`平均 6.4 → 平均 0.29` のように前後を並べる
- 採らなかった案も、なぜ採らなかったかを数値付きで残す
- 表は「つくり」のような一覧が並ぶ場所だけ。説明の代わりに表を使わない
- 記事だけの回など内容が軽い回で `## 確認` を `## 確認したこと` としている前例もある。迷ったら短いほうでよい

## 5. 見せてから作る

**PR を作る前に、タイトルと本文をそのまま会話に出して一度確認を取る。**
GitHub に出たものは他人が読むもので、語り口の直しは出す前のほうが安い。

## 6. push して PR を作る

OK が出たら、この 1 呼び出しで通す。

```bash
git push -u origin "$(git branch --show-current)" && \
gh pr create --base main --title "<タイトル>" --body-file "$BODY"
```

`gh pr create --body-file` は問題なく通る。壊れているのは `edit` 側だけ。

## 7. 作ったあと

URL を報告して終わり。マージはユーザーがやる。

### あとから本文を直す

**`gh pr edit --body-file` はこのリポジトリでは使えない。**
Projects (classic) 廃止の GraphQL エラーで落ちるのに **終了コードには出ず、本文も差し替わらない。**
成功したように見えるので気づけない。REST を直に叩く。

```bash
python3 -c "import json,io;print(json.dumps({'body':io.open('$BODY',encoding='utf-8').read()}))" > /tmp/pr-body.json
gh api repos/Riochin/portfolio-v2/pulls/<n> -X PATCH --input /tmp/pr-body.json -q .html_url
gh pr view <n> --json body -q .body | head -5   # 反映を必ず目で確かめる
```
