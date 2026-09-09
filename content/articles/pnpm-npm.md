---
title: "メモ：pnpmとnpmのnode_modulesの持ち方について調べた"
publishedAt: "2026-09-09"
draft: false
---

<br />

<br />

**pnpmを使う理由→名前がかわいい(ぷにぷみ)から。**

<br />

<br />

☝️そろそろこれを卒業したいお年頃・・・

<br />

といったタイミングで、このポートフォリオサイトをnpmからpnpmに移行したので、ついでに「依存関係（`node_modules`）の持ち方」って観点をメインに色々調べてみましたー！！！

## npm v2以前:ネスト地獄の時代

昔のnpm(v2以前)は、依存関係をそのままツリー状にネストして持っていました。

<br />

たとえばこのサイトの`package.json`だと、`next`と`@tailwindcss/postcss`が両方`postcss`に依存していて、その`postcss`がさらに`picocolors`に依存しています。これをそのままネストで持つと：

```
node_modules/
├── next/
│   └── node_modules/
│       └── postcss/
│           └── node_modules/
│               └── picocolors/    ← next用
└── @tailwindcss/
    └── postcss/
        └── node_modules/
            └── postcss/
                └── node_modules/
                    └── picocolors/    ← tailwind用(同じ1.1.1でも重複!)

```

`postcss`も`picocolors`も、同じバージョンなのに2箇所へ実ファイルとしてコピーされます。

<br />

これの困ったところ：

- 依存が増えるほどこの重複が積み重なって、`node_modules`が数百MB〜1GBに膨れ上がった（らしい）
- Windowsだとパスが伸びすぎて削除すらできなくなるケースもあった（らしい）

## npm v3:フラット化とphantom dependency

これを解決するために、npm v3では**フラット化(hoisting)**&#x304C;導入されました。

<br />

可能な限り全パッケージを`node_modules`直下に配置して、同じバージョンなら1つだけ持つ、という方式です。

```
node_modules/
├── next/
├── @tailwindcss/postcss/
├── postcss/          ← 共通、重複なし
├── picocolors/       ← 共通、重複なし
├── nanoid/
└── source-map-js/

```

<br />

ディスク容量問題は解決！

<br />

ところが、これにも困ったところがあります：

- **phantom dependency が起こる**
  - `package.json`に書いてない未宣言のパッケージが、なぜか`require`できてしまう現象のこと
  - 名前がかっこいい

```
// package.jsonにはnextしか書いてないのに
const postcss = require('postcss'); // 動いちゃう

```

phantom dependencyの原因は、Node.jsの**node\_modules探索アルゴリズム**にあります。

<br />

`require`されると、Node.jsは呼び出し元ファイルの位置を起点に`./node_modules` → `../node_modules` → `../../node_modules`と、上へ上へ探しにいきます。このとき見るのは各階層の`node_modules`直下だけで、ディレクトリの奥までは掘りません。

<br />

なので`require('postcss')`が呼ばれても、Node.jsは呼び出し元から`./node_modules`を見て`postcss`という名前のエントリがあるか確認するだけです。

フラット化のおかげで`postcss`(本来はnextの内部依存)が`node_modules`直下に置かれてるから、そのまま見つかってしまうのです。

## pnpm:3層構造でネスト地獄もphantom dependencyも回避

**ここで登場するpnpm❗️❗️❗️**

<br />

pnpmは、ネスト地獄ともフラット化とも違う、3層構造を取っています。

<br />

- **トップレベル** … `package.json`に書いた直接依存だけが並ぶ層
- **`.pnpm/`** … 使う全パッケージが`pkg@version`という名前でフラットに並ぶ層
- **グローバルstore** … 実ファイルが1つだけ置かれる層。ここだけプロジェクトの外(macOSなら`~/Library/pnpm/store/`)にある

<br />

3層目がプロジェクトの外にあるのがミソで、ここは**このマシンの全プロジェクトで共有されます**。

別のリポジトリで同じ`react@19.2.8`を入れても、実ファイルはstoreにある1つを見に行くだけです。npm v2で`node_modules`が膨れ上がってた話が、pnpmではプロジェクトをまたぐレベルで解決されます！！

<br />

ということで、pnpmの`node_modules/`を見て見ましょう。

矢印(`→`)が「どこを指してるか」に注目して見てみてください！：

```
node_modules/
├── next                          → .pnpm/next@16.3.4/node_modules/next
├── @tailwindcss/postcss          → .pnpm/@tailwindcss+postcss@4.3.3/node_modules/@tailwindcss/postcss
│
└── .pnpm/
    ├── next@16.3.4/
    │   └── node_modules/
    │       ├── next              → グローバルstore
    │       └── postcss           → ../../postcss@8.5.23/node_modules/postcss
    │
    ├── @tailwindcss+postcss@4.3.3/
    │   └── node_modules/
    │       ├── @tailwindcss/postcss  → グローバルstore
    │       └── postcss           → ../../postcss@8.5.28/node_modules/postcss
    │
    ├── postcss@8.5.23/
    │   └── node_modules/
    │       ├── postcss           → グローバルstore
    │       └── picocolors        → ../../picocolors@1.1.1/node_modules/picocolors
    │
    ├── postcss@8.5.28/
    │   └── node_modules/
    │       ├── postcss           → グローバルstore
    │       └── picocolors        → ../../picocolors@1.1.1/node_modules/picocolors
    │
    └── picocolors@1.1.1/
        └── node_modules/
            └── picocolors        → グローバルstore

```

<br />

`.pnpm/`直下の名前は見やすさのために簡略化してます。実物はpeer dependencyの解決結果までエンコードされてるので、`next@16.3.4_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8`みたいなことになってます。

### **なぜphantom dependencyが起きない?**

- トップレベルには直接依存(`package.json`に書いたもの)へのリンクしかない
- `postcss`や`picocolors`のような間接依存はトップレベルにも自分のコードの探索パスにも存在しないので、Node.jsの解決アルゴリズムをそのまま使っても「たまたま見つかる」ことがなく、requireが不可能

### **なぜネスト地獄にならない?**

- `.pnpm/`も見た目は**階層的(ネスト)**
- npm v2との違いは「ネストした先に何が置かれてるか」

  - npm v2はネストした先に**実体のコピー**を置いていたから重複が起きた
  - pnpmはネストした先に**リンク**を置くだけで、実体はバージョンごとに1つ(`.pnpm/{pkg}@{version}/`)しか存在しない
- バージョン違いが複数あっても、`.pnpm/`はフラットな1階層に`pkg@version`という名前で共存させている

### **シンボリックリンクとハードリンク**

さっきの図では矢印を全部`→`で書きましたが、実はこれには2種類のリンクが混在しています。

- **シンボリックリンク(symlink)**&#x20;
  - 平たく言えばショートカット。
  - ただし普通のショートカット(.lnk)がアプリケーション側の解釈でジャンプするのに対して、symlinkはOSがサポートしてる機能で、ファイルを開こうとした瞬間にOSが透過的にリンク先へ転送してくれる
- **ハードリンク (hardlink)**
  - &#x20;1つの実体(inode)に対して別の名前が複数ついている状態。
  - どちらの名前を消しても、もう一方が残っていれば実体は消えない。
  - 片方を編集すると、もう片方も(同じ実体だから)変わる

<br />

pnpmはこの2つを、以下のように使い分けています：

- 「自分自身の実体を指す1本」(`.pnpm/pkg@ver/node_modules/pkg` → グローバルstore) = **ハードリンク**
- 「他パッケージへの依存を表す矢印」(トップレベルの直接依存、`.pnpm/`内のパッケージ間参照) = **シンボリックリンク**。

<br />

さっきの図から`next` → `postcss`の1本だけ抜き出すと、こんな感じです：

```
node_modules/
└── next                    [symlink]  → .pnpm/next@16.3.4/node_modules/next
                                          └ 依存を表す矢印

    .pnpm/
    ├── next@16.3.4/
    │   └── node_modules/
    │       ├── next        [hardlink] → グローバルstore
    │       │                             └ next自身の実体
    │       └── postcss     [symlink]  → ../../postcss@8.5.23/node_modules/postcss
    │                                     └ 依存を表す矢印
    │
    └── postcss@8.5.23/
        └── node_modules/
            └── postcss     [hardlink] → グローバルstore
                                          └ postcss自身の実体
```

`.pnpm/{pkg}@{version}/node_modules/`の中で、**自分と同じ名前のものだけがハードリンク**(=実体)で、**残りは全部symlink**(=矢印)になってるのがポイントです。

## まとめ

| <br />             | npm v2       | npm v3以降 | pnpm                       |
| :----------------- | :----------- | :------- | :------------------------- |
| 構造                 | ネスト          | フラット     | 3層(トップ/`.pnpm`/グローバルstore) |
| 重複                 | 起きる(実体ごとコピー) | 起きない     | 起きない(symlink参照 + ハードリンク)   |
| phantom dependency | -            | 起きる      | 起きない                       |

<br />

pnpmは「階層構造」を取ってるけど、npm v2のネスト地獄とは別物でした。

ネストした先に置くのが、**実体のコピー or 既存実体への参照** って違いがいちばん大きいみたいでした！

少しだけですが、pnpmを選ぶ理由が説明できるようになったぞ〜！（めでたし）

## 新しく調べた用語のおさらい

| 用語                    | ざっくり                                              |
| :-------------------- | :------------------------------------------------ |
| node\_modules探索アルゴリズム | `require`されると`./node_modules`から上へ上へ探す。各階層の直下しか見ない |
| シンボリックリンク(symlink)    | OSがサポートしてるショートカット。開いた瞬間に透過的にリンク先へ飛ばされる            |
| ハードリンク                | 1つの実体(inode)に複数の名前がついた状態。片方を消しても実体は残る             |
| APFS clone(macOS固有)   | コピー時は実体を共有し、編集された分だけ分離する                          |
| phantom dependency    | 未宣言のパッケージが、なぜか`require`できてしまう現象                   |

## 参考

- <https://qiita.com/iGeMi/items/2be097d5c6c9111f81c4>
- <https://zenn.dev/yuichi_ai/articles/node-modules-structure-explained#pnpm%E3%81%AE3%E5%B1%A4%E6%A7%8B%E9%80%A0>
- <https://zenn.dev/yuichi_ai/articles/phantom-dependency-explained-with-examples>
