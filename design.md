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

## ヒーローの文言と語り

外部のデザイナーからの指摘 (2026-09):「海だけで『で、誰？』になる」「クリックの意図が読めない」「シンプルだが単調」。

問題はコンセプトの不在ではなく**未宣言**。あの空は心象風景 (実在しない、いつか行きたい海) だが、その一行がどこにも書かれていないので綺麗な背景にしか見えない。出現率を下げてある流れ星も、待つ理由が無いので誰も出会わない。

**世界観が主、プロフィールが従。**トップでは名乗らず、全画面に入った人にだけ人格が現れる ── 遠くの灯りに近づくと人がいる、という漁火と同じ構造を歓迎の設計にする。

### トップの文言

| | ja | en |
|---|---|---|
| ライト | ようこそ、いつか行きたい海へ。 | Welcome to the sea I hope to see someday. |
| ダーク | ようこそ、いつか行きたい夜の海へ。 | Welcome to the night sea I hope to see someday. |

`Welcome to my portfolio` が悪いのは「ようこそ」ではなく行き先。作品集に招かれても嬉しくないが、海に招かれたら嬉しい。

全画面への誘いは `近づいてみる` / `Come closer`。About 導線は `About me` のまま据え置く ── 一度は `私のことも、少しだけ` を当てたが、世界の言葉を 1 画面に 2 つ並べると誘いが 2 つあるように読めて、主役の `近づいてみる` が埋もれた。行き先の名前は名前のままでいい。

- デスクトップはホバーで出す。カーソルが近づいたら言葉が現れる = 所作と意味が一致する
- **全デバイス共通で、滞在 10 秒でも出す。**スマホにホバーが無く来訪の大半がスマホなので、ホバーだけだと入口の案内が一度も出ない。デバイスで分岐はさせない
- 枠も背景も付けない (囲うと UI 部品になる)。フェード 0.3〜0.4 秒、同時に空を 1〜2% 寄せる

### ナビのホバー

ナビ自体は英語のまま。短く硬いほうが機能するので崩さず、ホバーのときだけ言い換えを添える。

| ナビ | ja | en |
|---|---|---|
| About me | 私のこと | Who I am |
| Works | つくったもの | Things I've made |
| Experience | これまでのこと | Where I've been |
| Output | 伝えたこと | What I've shared |

- 4 つ全部に用意する (2 つだけだと壊れて見える)。レイアウトは動かさない (場所を先に確保する)
- モバイルはハンバーガーの中で最初から両方出す。場所があるので隠す理由が無い
- 秒数とイージングは「近づいてみる」と完全に揃える。揃っていること自体が「同じ手で作られている」の正体

### 声のルール

1. UI の言葉を使わない (「全画面表示」ではなく「近づく」)
2. **台本は です・ます、反応は独り言のタメ口。**丁寧な人が驚いた瞬間だけ素が出る
3. 言い切らない。断定は世界観を壊す
4. 自己 PR をしない。受賞や実績は Works が語る
5. 英語は直訳せず、同じ温度で書き直す
6. `aria-label` だけは世界の言葉にしない。読み上げは正確さを優先

### 語りは 2 系統

**台本** (時間で進む) と **反応** (出来事に応じる)。ぶつかったら**反応が勝つ** ── 反応は 1 秒遅れると何の話か分からなくなるが、台本は次のスロットに送れる。

### 台本

| 時間 | ja | en |
|---|---|---|
| 0:00 | *(黙っている)* | |
| 0:03 | こんにちは、Riochin です！ | Hi, I'm Riochin! |
| 0:08 | *(昼=鳥 / 夜=流れ星 への反応)* | |
| 0:20 | この海は、どこにもありません。いつかこんな景色を見てみたくて、つくりました。 | This sea doesn't exist anywhere. I made it because I want to see something like it someday. |
| 0:33 | 私がうるさかったら、右上のボタンで黙ります！ | If I'm talking too much, the button up there will shut me up! |
| 1:30 | まだ見ててくれてるんですね！！うれしいです。 | You're still here!! That makes me really happy. |
| 2:30 | ここ、けっこう静かですよね。 | It's quiet here, isn't it. |
| 4:00 | つくったものが、向こうにあります。よかったらそっちも見てってください！ | The things I've made are just over there. Come see them if you'd like! |

- **最初の 3 秒は黙る。**空が広がった瞬間に文字を乗せない
- **0:08 の反応だけクールダウンを無視して 0:03 に続けてよい。**名乗った直後に世界を指させば「解説者ではなく隣にいる人」が伝わる
- **ボタンの案内は種明かしの後ろ。**先に出すと「これからうるさくします」の予告になる
- **2:30 だけ「！」が無い。**元気だった人が一段声を落とすので、ここで静けさが効く。意図的に守る
- **4:00 で台本は終わり、以降は反応だけ。**永遠に喋るものは嫌われる。間隔も広げていき、時間とともに静かになる

### 冒頭 8 秒を昼夜で揃える

昼は `BIRDS.firstGap = 8` が固定値なので全員が必ず鳥を見る。夜は鳥が飛ばず (`HeroScene.tsx` の `DayScene` / `NightScene` で出るものが別)、`SHOOTING_STAR_CADENCE.full` が `[14, 34]` なので 1 本目が確定しない。**夜も 1 本目だけ 8 秒に確定させる。**2 本目以降は既定の間隔に戻すので、出現率を下げた方針は後半にそのまま残る。

昼: 雲・鳥・飛行機雲・船 / 夜: 天の川・星・流れ星・夜行便・漁火。`NavLights` は左舷赤 / 右舷緑 / 白ストロボの**航空機**であって船ではない。

### 反応 (昼)

| きっかけ | ja | en |
|---|---|---|
| 鳥 | あ、みてください！海鳥が来ました！ | Look! A seabird came by! |
| 飛行機雲 | 飛行機だ！私も乗せてくださ〜い！ | A plane! Take me with youuu! |
| 船 | 見えますか？船が通ってる。どこまで行くんだろう... | Can you see it? A ship. I wonder how far it's going... |
| 雲 (静かな時間に) | 雲、ゆっくりだなあ。 | The clouds are so slow. |
| 水平線 (静かな時間に) | 水平線、まっすぐすぎる。 | That horizon is way too straight. |
| 入道雲 (静かな時間に) | ここで一句。真っ白な　もくもく雲が　めちゃデカい。 | Here's a haiku: Pure white and fluffy / that big cloud piled over there / it's like, super huge. |

### 反応 (夜)

| きっかけ | ja | en |
|---|---|---|
| 夜行便 | おっ、夜行フライト！どんな人が乗ってるんだろう・・・ | Ooh, a red-eye! I wonder who's on board... |
| 夜行便 (1 分後) | さっきの飛行機、まだ飛んでますよ。いいなあ、旅行・・・ | That plane from earlier is still up there. Lucky... I want to travel too... |
| 天の川 | 天の川、見たことありますか？ここなら、街の灯りがないからめちゃくちゃ綺麗に見えますね！！ | Have you ever seen the Milky Way? Out here there are no city lights, so it looks incredible!! |

1 分後の呼び戻しが成立するのは `NAV_LIGHTS.duration = [150, 230]` で、夜行便が渡り切るのに 2 分半〜4 分かかるため。**まだ絶対にそこにいるので、セリフが必ず本当になる。**

### 流れ星 (シャッフル / 毎回反応する)

| ja | en |
|---|---|
| おっ流れ星！！！ | Ooh, a shooting star!!! |
| めっっちゃ楽しく過ごせますように！ | I hope every day is super fun! |
| 健康に暮らせますように！ | I hope everyone stays healthy! |
| 次のハッカソンも、うまくいきますように！ | I hope the next hackathon goes well too! |
| 朝起きれますように！ | I hope I can get up in the morning! |
| 夜ちゃんと寝れますように！ | I hope I actually sleep tonight! |
| 美味しいものいっぱい食べられますように！ | I hope I get to eat lots of good food! |
| ……あっ、願い事って言うと叶わないんだっけ？ | ...oh wait. Doesn't saying it out loud break it? |
| 願い事！！……言い忘れちゃった！ | A wish!! ...ah, I forgot to actually make one! |

大きい願いのあとに小さい願いが来る**落差が笑いどころ**なので、生活まわりの小さいものを必ず混ぜる。大小は 3 対 3 で釣り合わせる ── 小さいほうが減ると、ただの前向きな人になってしまう。ハッカソンの願いに「次の**も**」が付いているのは、**受賞歴を Works に預けたまま、こちらでは威張らないため**。海の上でぼやいている人と Works に並ぶ受賞のあいだの落差は、見に行った人だけが気づけばいい。最後の 2 つは**願い事にならなかった回**で、この 2 つ合わせて 10 回に 1 回程度。落ちの型が「言ったら叶わない」と「言い忘れた」の 2 つあっても**率は上げない** ── 落ちが続けて出ると、願い事の袋そのものが落ちの前振りに見えてしまう。

願い事にならなかった 2 つには続きを付けない ── 自分が言えていないのに「あなたも」とは訊けない。それ以外の願い事の直後 3 秒だけ、続けて `あなたもお願いできました？` / `Did you get your wish in too?` を出す。**ひとりごとがふとこちらを向く瞬間**なので、単独では引かない。ただし**毎回は付けない (2 回に 1 回)** ── 流れ星には毎回反応するので、毎回付けると同じ一言が繰り返し出て、ふと向く瞬間ではなくなる。「おっ流れ星！！！」は願い事ではないのでそもそも付かない。

### 反応 (レア / 状態)

| きっかけ | ja | en |
|---|---|---|
| タブから戻った (`visibilitychange`) | あ、戻ってきた！おかえりなさーい！ | Oh, you're back! Welcome baaack! |
| 同セッションで 2 回目の全画面 | また来てくれた！ | You came back in! |

音の素材が入るまでの期間限定で、静かな時間に `波の音も聞こえたらいいのになあ。` / `I wish you could hear the waves too.` を出す。**足りないものを隠さず願いに変える。**音が入ったらこの行だけ消す。

静かな時間にこぼす独り言をもう 2 つ持つ: `なにも起きない時間って、けっこう好きです。` / `I kind of love it when nothing happens.` と `あれ、もうこんなに経ってる。` / `Huh. It's been that long already.` 前者は**黙っていられるほうが隣にいて心地よいという方針を、本人の口から言わせる**もの。後者は**見ている人の感じ方をこちらが決めない** ── 「時間経っちゃいますよね」と同意を求めると独り言ではなく話しかけになるので、ふと我に返るのは自分のほうにする。

答えを求めない問いかけも 1 つ持つ: `あなたは、どこから見てくれてるんでしょうか。` / `I wonder where in the world you're watching this from.` **選択肢メニュー付きの会話 UI は採らない** ── 構造がチャットボットそのもので、AI っぽさの指摘に対して最悪の返答になるうえ、主役が世界観からプロフィールに移る。

### 長くいてくれた人

| 滞在 | ja | en |
|---|---|---|
| 10 分 | まだいる！！！ もう友達ですね。 | You're STILL here!! I think we're friends now. |
| 30 分 | 30分！すごい。よく飽きないですね。……私も同じです。 | Thirty minutes! Wow. You really don't get bored, do you. ...Same here, though. |
| 45 分 | いつか、ほんとうにこんな景色を見に行けたらいいですね。 | I hope we get to see something like this for real someday. |
| 1 時間 | ありがとうございます。……なんか、そう言いたくなりました！ | Thank you. ...I don't know, I just wanted to say that! |

- **音量は上げない。**「！！！」→「！」→ 無し →「！」と落ちていく。上げ続けると 4:00 以降の「時間とともに静かになる」と逆走するので、近づくのは距離のほうだけにする。最後の「！」はお礼のひと押しで、驚きの続きではない
- **45 分は 0:20 の種明かしへの折り返し。**「いつかこんな景色を見てみたくて、つくりました。」で始まった願いが、ここで主語を増やして戻ってくる
- **1 時間で語りは打ち止め。**終わりがあるから最後の一言が最後になる
- この時間帯には静かな時間の独り言も出尽くしているので、**久しぶりに口を開くことになる**。それ自体が重みになる
- 数えるのは**実際に見ていた時間**だけ (タブを離れている間は止まるので「1 時間」が嘘にならない)。全画面に入り直すと 0 に戻る ── 一続きで見ていたからこそ効く数字なので、通算はしない
- 節目にぶつかって言えなかったら **30 秒だけ粘り、それでも駄目なら諦めて次の段へ**。段ごとに独立して数えるので、10 分を逃した人も 30 分で拾える

### 訪問者の現地時刻

ブラウザから読めるので、相手の国の時間に反応する。「全世界に見てほしい」がそのまま機能になる。

| 相手の時刻 | ja | en |
|---|---|---|
| 朝 | そっちはもう朝ですか？ いいなあ。 | Is it morning where you are? Nice. |
| 夜 | そっちも、もう夜ですか？ | Is it night where you are too? |
| 深夜 2〜4 時 | まだ起きてるんですか！？ 私もです。 | You're still up!? Same here. |

### 反応の総量

**言えることが増えたことと、言うことは別。**黙っていられるほうが隣にいて心地よい。

- **何か喋ったら最低 10 秒は黙る。**種類が増えるほど連発しやすくなるので絶対に守る
- 素の反応率は流れ星だけ毎回 (7 パターンあるので飽きない)。鳥・船・飛行機は 3〜4 割で、**パターンが増えても上げない**
- **その反応率は時間とともに落ちる。**半減期は台本の長さと同じ 4 分 ── 台本が終わる 4:00 でちょうど半分になり、以降も 4 分ごとに半分ずつ、1 割で下げ止まる。**最初の数分はよく喋り、あとは流れ星が降っても黙って見ている。**「時間とともに静かになる」を、間隔ではなく気の向き方のほうで実装したもの。完全に 0 にしないのは、まったく反応しなくなると壊れたように見えるため
- **0:08 の反応にだけは率を掛けない。**名乗った直後に世界を指させることが「解説者ではなく隣にいる人」の正体なので、ここを 3〜4 割の抽選に任せると、昼の来訪者の 3 人に 2 人が取りこぼす。クールダウンと合わせて、冒頭の 1 回だけ二重に通す
- 同じセリフを 2 回続けない。同じ出来事が続いたら 2 回目は黙る
- 反応は出来事から 1 秒以内。遅れたら出さない

減衰が要るのは夜の事情による。流れ星は 2 本が別々に間隔を数える (`SHOOTING_STAR.count = 2` × `interval [14, 34]`) ので**平均 12 秒に 1 本**降り、しかも流れ星には毎回反応すると決めてある。実際に回すと **22 秒に 1 回喋り続け、沈黙が 90 秒に届かないので静かな時間の独り言が一度も出ない** ── 天の川の行も波の音も、夜は全部死んでいた。減衰を入れると 0〜5 分は 27 秒に 1 回、15 分以降は 105 秒に 1 回まで落ちて、独り言も出るようになる。昼は鳥が `[10, 40]` 秒間隔 + 渡り 16〜25 秒で 3〜4 割しか拾わないので、もともとこうはならない。
- 静かな時間の独り言は、**90 秒黙ってから 1 つ。出すたびに次に要る沈黙が 30 秒ずつ延びる** (上限 5 分)。引いたら戻さない袋から選ぶので、使い切るまで同じ独り言は回ってこない
- **手札が増えてもお喋りにはならない。**増えるのは繰り返しまでの距離だけで、口を開く条件は変わらない

### 静かにするボタン

| 状態 | アイコン (lucide) | ラベル |
|---|---|---|
| 話す | `message-circle` | 静かにする / Quiet |
| 黙っている | `message-circle-off` | 話しかける / Talk to me |

**アイコンは今の状態を映し、押すと何が起きるかはラベル (`aria-label`) が言う。**アイコンにも行き先を持たせると、話している最中に斜線付きが出て「もう黙っている」ように読める。

- **止まるのは語りだけ。世界はそのまま。**黙らせたのは私であって世界ではない
- 押したら `わかりました、静かにします！` / `Got it, I'll be quiet!` を出してそれきり黙る。元気に返事してからピタッと止まる落差で、そのあとの静けさが際立つ。この一言だけフェードは短くする
- 戻したら `また話せるんですね！やったー！` / `You'll talk to me again! Yesss!`
- **設定は localStorage で覚える。**一度「静かに」と言った人に次も話しかけるのは失礼

### 再訪した人

| | 初回 | 2 回目以降 |
|---|---|---|
| 挨拶 | こんにちは、Riochin です！ | おかえりなさい！また来てくれて嬉しいです。 / *Welcome back! I'm so glad you came again.* |
| 種明かし (0:20) | 出す | **出さない** |
| ボタンの案内 (0:33) | 出す | **出さない** |

種明かしは**一度きりだから価値がある**。ボタンの説明も知っている人にはただの雑音。結果として**通うほどこの海は静かになる**。

**「2 回目以降」になるのは、種明かし (0:20) を最後まで聞き終えた人だけ。**全画面に入った瞬間に記録すると、間違えて開いて 5 秒で閉じた人まで再訪扱いになり、**いちばん聞いてほしい一行を二度と聞けなくなる**。一度きりだから価値がある、の一度は、本当に一度聞けた人の一度でなければ意味がない。

同セッションで 2 回目に入ったかどうか (挨拶が `また来てくれた！` になる) は別勘定で、こちらは入場のたびに数える。前回 0:20 まで居なかった人は、**2 回目の挨拶を受けたうえで種明かしもちゃんと聞ける**。

### 出し方

- 場所は画面の下寄り (中央は空を隠す)。モバイルはホームバーぶん上げる
- **出るのは 1 文字ずつ。**トップの挨拶文と同じ結像 (`globals.css` の `hero-welcome-char`) を使い回す ── 同じ手で現れるからこそ、全画面の語りが同じ人の声に聞こえる。消えるときだけ 1 枚でフェードする (読み終えた人を 1 文字ずつ待たせない)
- 消えるのは自動で、だいたい 2 秒 + 1 文字ぶん。**1 文字あたりは ja 0.15 秒 / en 0.08 秒**と言語で変える ── 日本語の 1 字と英語の 1 字では運ぶ情報量が違い、同じ係数だと英語だけ 16 秒も空に貼り付く。フェードの秒数とイージングはホバーの演出と揃える
- **2 文ある長い行は、文の切れ目で行を送る** (種明かし / 4:00 / 船 / 夜行便の呼び戻し / 天の川 / 入道雲の一句 / 30 分 / 1 時間)。折り返しを幅まかせにすると「ここなら、街の」で切れたりして、息継ぎの位置が画面ごとに変わる
- **枠も背景も名前も吹き出しの尻尾も付けない。**文字だけ。囲うとチャット UI になる。薄い影かぼかしだけ添える
- `aria-live="polite"` に載せる。「静かにする」はこちらにも効く
- `prefers-reduced-motion` でも語りは出す (動きではなく情報なので)。フェードだけ短くする

### 閉じるとき

見える文字は `もどる` / `Head back` (`aria-label` は「全画面表示を閉じる」のまま)。閉じ際に `またきてください。` / `Come back anytime.`
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

### 本文の画像

Milkdown の既定は拡大率を **Markdown の alt 欄に**書き込む (`![1.00](...)`)。画像は url / alt / title の 3 枠しか無く、そこに src / ratio / caption を詰めた結果、alt の居場所が無い ── 開いて保存するだけで書いた説明が消えていた。`src/components/studio/imageBlockMarkdown.ts` でスキーマの ctx を差し替え、alt を残すようにした。

- 等倍: `![説明](/articles/x/y.png "キャプション")` ── 標準の Markdown のまま
- 縮小あり: `<img src alt title data-scale="0.45" />` ── 4 つ目の値が要るのでこのときだけ HTML。`rehype-raw` を通してあるので公開側でも描ける

`extendSchema` は同じ id で新しいプラグインを作るため Crepe が積んでいるものと衝突する。スキーマを持つスライス (`imageBlockSchema.key`) を `ctx.update` で差し替えるほうが安全。

**拡大縮小は比率を保った縮小**で、トリミングではない。エディタの img は width を持たない (auto) ので、ドラッグで高さを動かすと幅も比例して動く ── 実測で 400x200 に `height:100px` を与えると 200x100 になる。したがって倍率はそのまま「本文幅に対する幅の割合」として読め、公開側は `width: <割合>%` + 高さ auto で同じ見え方になる。`sizes` も割合に合わせて縮め、要らない大きさの画像を取りに行かせない。

画像ブロックには alt の入力欄が無く、書けるのはキャプションだけ。alt が空のときは公開側でキャプションを alt に代える。

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
- どちらも MIT。改変は許諾されているが、色の値を公開ページに焼き込んで配る以上は著作権表示が要るので、リポジトリ直下の `THIRD-PARTY-NOTICES.md` に置いた
- ただし**背景だけはテーマの値を使わない**。rose-pine-dawn の地色 `#faf4ed` は暖色寄りで、ページの `#fbf3f5` に置くとそこだけ黄みがかって見える。サイトの `--surface` に差し替え、他のカードと同じく `--border` の枠を添える。ダークは Dracula の地色をそのまま使う (あの配色は自前の暗い面を前提に作られている)

`react-markdown` は同期版の `<Markdown>` ではなく `MarkdownAsync` を使う。shiki の rehype プラグインが非同期で、同期版は内部で `runSync()` を呼ぶため例外になる。

言語定義は `shiki` の既定 bundle (8MB 超) を丸ごと積まず、core に必要なものだけ明示的に積む。正規表現エンジンも WASM (oniguruma) ではなく JS 実装を `forgiving` で使う。

**言語まわりで 2 回ハマった。どちらも「色が付かないだけでエラーは出ない」ので気付きにくい:**

- **積んでいない言語は無着色になる。** `fallbackLanguage` で text に落ちるので本文は普通に出るが、書いた側からは「テーマが効いていない」ようにしか見えない (Java で踏んだ)。使いそうな言語は先に入れておく
- **shiki の言語 ID は小文字固定。** ` ```Java ` のように書かれると引けない。書き手が気にすることではないので `rehypeLowercaseLang` で均す
- **Crepe の CodeMirror は言語リストの既定が空** (`const { languages = [] } = config`)。`@codemirror/language-data` を渡さないと、エディタ側はどの言語も色が付かない ── テーマを差し替えても塗る対象が無い

エディタ側の CodeMirror も同じ 2 つに揃える。ライト用の rose-pine-dawn は CodeMirror 向けの実装が無いので、同じ配色を `createTheme` で張り直した (`src/components/studio/rosePineDawnCodeMirror.ts`)。判定はマウント時の 1 回きり ── 差し替えには Compartment が要るが、書いている途中にテーマを切り替えるのは稀なので持ち込まない。

### studio の見た目

Crepe の既定テーマ (frame) はサイトのトークンに繋ぎ替える (`src/components/studio/milkdown-theme.css`)。書く画面と公開後の見た目が違うと、書きながら仕上がりを判断できない。

- 既定の書体は Noto Serif / Noto Sans。見出しも本文も **Zen Maru Gothic** に差し替える
- 本文は 18px。サイト本体の `--text-base` と同じにして、書いている最中と公開後の行長を揃える
- `--crepe-color-*` は全て `--background` / `--surface` / `--border` / `--foreground` / `--muted-foreground` / `--accent` に繋ぐ。これらは `globals.css` が `:root` と `.dark` の両方で定義しているので、テーマ切替には何も足さずに追随する
- ホバーと選択は `color-mix` でアクセントを透過で被せる。地の色が明暗で入れ替わっても被せ方は変わらない
- `globals.css` ではなく専用ファイルに置くのは、studio が dev 専用の道具だから。テーマ CSS の**後**に読ませ、セレクタも `.milkdown` の中に閉じてある
