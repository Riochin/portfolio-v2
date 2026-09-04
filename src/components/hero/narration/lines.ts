import type { Localized } from "@/lib/i18n/types";

/**
 * 全画面のときだけ現れる語りの、言葉そのもの。
 *
 * dictionary.ts に入れないのは量のため。DICT は「節 → 葉」の 2 段しか
 * 許さない構造で、しかも全ページの Server Component が読む辞書なので、
 * ここだけで 30 行を越える語りを混ぜると、UI 文言を探しに来た人が毎回
 * これを跨ぐことになる。語りは全画面の中でしか使わないので、使う場所の
 * 隣に置く。
 *
 * 声のルールは design.md の「声のルール」にある。要点は 2 つ:
 *   ・台本は です・ます、反応は独り言のタメ口。丁寧な人が驚いた瞬間だけ素が出る
 *   ・英語は直訳ではなく、同じ温度で書き直したもの
 * 「！」の数も文末の「・・・」と「...」の違いも意図した設計なので、
 * 揃えたくなっても揃えないこと。
 */
export type Line = Localized<string>;

/**
 * 文中の `\n` はそこで行を送る。
 *
 * 2 文ある長い行は、放っておくと画面の幅次第でどこで折れるか変わり、
 * 「ここなら、街の」で切れたりする。文の切れ目で送れば、どの幅でも
 * 息継ぎの位置が同じになる ── 声に出したときの間と一致する。
 * 短い行には入れない (入れると読点を跨いだだけの改行になる)。
 */

/**
 * 挨拶。0:03 のスロットで、来訪の状況に応じて 1 本だけ選ぶ。
 *
 * again (同セッションで 2 回目の全画面) は design.md では「反応 (レア / 状態)」
 * に並んでいるが、出る時機は挨拶とまったく同じなので、挨拶の言い換えとして
 * 持つ。2 回目に入った人へ「こんにちは」と名乗り直すほうが不自然。
 */
export const GREETING = {
  /** 初回 */
  first: { ja: "こんにちは、Riochin です！", en: "Hi, I'm Riochin!" },
  /** 再訪 (localStorage に記録がある) */
  returning: {
    ja: "おかえりなさい！\nまた来てくれて嬉しいです。",
    en: "Welcome back!\nI'm so glad you came again.",
  },
  /** 同じセッションで 2 回目に全画面へ入った */
  again: { ja: "また来てくれた！", en: "You came back in!" },
} as const satisfies Record<string, Line>;

/** 台本の各行。0:03 の挨拶だけは GREETING が持つ */
export const SCRIPT_LINES = {
  /** 0:30 種明かし。一度きりだから価値があるので、再訪では出さない */
  reveal: {
    ja: "この海には、モチーフがありません。\nいつかこんな景色を見てみたくて、つくりました。",
    en: "This sea isn't based on any real place.\nI made it because I want to see something like it someday.",
  },
  /** 0:45 静かにするボタンの案内。種明かしより後ろに置く ── 先に出すと
      「これからうるさくします」の予告になる。再訪では雑音なので出さない */
  button: {
    ja: "私がうるさかったら、右上のボタンで黙ります！",
    en: "If I'm talking too much, the button up there will shut me up!",
  },
  stillHere: {
    ja: "まだ見ててくれてるんですね！！\nうれしいです。",
    en: "You're still here!!\nThat makes me really happy.",
  },
  /** 2:30。ここだけ「！」が無い ── 元気だった人が一段声を落とすので、
      静けさが効く。意図的に守ること */
  hush: { ja: "ここ、けっこう静かですよね。", en: "It's quiet here, isn't it." },
  works: {
    ja: "つくったものが、向こうにあります。\nよかったらそっちも見てってください！",
    en: "The things I've made are just over there.\nCome see them if you'd like!",
  },
} as const satisfies Record<string, Line>;

export type ScriptKey = "greeting" | keyof typeof SCRIPT_LINES;

/**
 * 台本のスロット。at は全画面に入ってからの秒数。
 *
 * ・0:00 は黙っている。空が広がった瞬間に文字を乗せない
 * ・0:15 にスロットが無いのは、そこが「昼=鳥 / 夜=流れ星」への反応の
 *   居場所だから。冒頭 15 秒は昼夜どちらでも必ず何かが起きるようにして
 *   あるので (BIRDS.firstGap / SHOOTING_STAR_CADENCE.full.firstGap)、
 *   台本は場所を空けて待つ
 * ・at はスロットの時刻であって、その秒に必ず出る約束ではない。冒頭の
 *   反応が読み終わるまで種明かしは待たされるので、実際に出るのは
 *   0:30 と 0:48 前後になる (ぶつかったぶんは pending が次の tick へ送る)
 * ・4:00 で台本は終わり、以降は反応と、静かな時間の独り言だけになる。
 *   永遠に喋るものは嫌われる
 */
export type ScriptSlot = {
  /** 全画面に入ってからの秒数 */
  readonly at: number;
  readonly key: ScriptKey;
  /** 初回だけ出す行か (種明かしとボタンの案内) */
  readonly firstVisitOnly?: boolean;
};

export const SCRIPT: readonly ScriptSlot[] = [
  { at: 3, key: "greeting" },
  { at: 30, key: "reveal", firstVisitOnly: true },
  { at: 45, key: "button", firstVisitOnly: true },
  { at: 90, key: "stillHere" },
  { at: 150, key: "hush" },
  { at: 240, key: "works" },
];

/**
 * 空で起きたことへの反応。出るものが昼夜で違う (HeroScene の DayScene /
 * NightScene) ので、候補もテーマで分ける。ここに無い出来事は、そのテーマ
 * では起こらないものとして黙って捨てる。
 */
export const REACTIONS = {
  light: {
    bird: {
      ja: "あ、みてください！海鳥が来ました！",
      en: "Look! A seabird came by!",
    },
    contrail: {
      ja: "飛行機だ！私も乗せてくださ〜い！",
      en: "A plane! Take me with youuu!",
    },
    ship: {
      ja: "見えますか？船が通ってる。\nどこまで行くんだろう...",
      en: "Can you see it? A ship.\nI wonder how far it's going...",
    },
  },
  dark: {
    navLights: {
      ja: "おっ、夜行フライト！\nどんな人が乗ってるんだろう・・・",
      en: "Ooh, a red-eye!\nI wonder who's on board...",
    },
  },
} as const;

/**
 * 夜行便を 1 分後に呼び戻す一言。
 *
 * NAV_LIGHTS.duration は [150, 230] 秒 ── 夜行便が渡り切るのに 2 分半から
 * 4 分かかるので、1 分後にはまだ絶対にそこにいる。セリフが必ず本当になる。
 */
export const NAV_LIGHTS_RECALL = {
  ja: "さっきの飛行機、まだ飛んでますよ。\nいいなあ、旅行・・・",
  en: "That plane from earlier is still up there.\nLucky... I want to travel too...",
} as const satisfies Line;

/**
 * 流れ星。7 パターンあるので毎回反応しても飽きない。
 *
 * 大きい願いのあとに小さい願いが来る落差が笑いどころなので、生活まわりの
 * 小さいものを必ず混ぜること。
 */
export const WISHES = [
  { ja: "おっ流れ星！！！", en: "Ooh, a shooting star!!!" },
  { ja: "めっっちゃ楽しく過ごせますように！", en: "I hope every day is super fun!" },
  { ja: "健康に暮らせますように！", en: "I hope everyone stays healthy!" },
  {
    ja: "次のハッカソンも、うまくいきますように！",
    en: "I hope the next hackathon goes well too!",
  },
  { ja: "朝起きれますように！", en: "I hope I can get up in the morning!" },
  { ja: "夜ちゃんと寝れますように！", en: "I hope I actually sleep tonight!" },
  {
    ja: "美味しいものいっぱい食べられますように！",
    en: "I hope I get to eat lots of good food!",
  },
] as const satisfies readonly Line[];

/** 願い事ではないので、続きの一言 (WISH_FOLLOWUP) は付かない */
export const WISHES_WITHOUT_FOLLOWUP = 1;

/**
 * 願い事にならなかった回。願い事の代わりに、10 回に 1 回程度どちらかが出る。
 *
 * 種類が増えても率は上げない (「反応の総量」と同じ考え方) ── 落ちが続けて
 * 出ると、願い事の袋そのものが落ちの前振りに見えてしまう。
 * どちらも願い事を言えていないので、続きの一言 (WISH_FOLLOWUP) は付かない
 * ── 自分が言えていないのに「あなたも」とは訊けない。
 */
export const WISH_MISSES = [
  {
    ja: "……あっ、\n願い事って言うと叶わないんだっけ？",
    en: "...oh wait.\nDoesn't saying it out loud break it?",
  },
  {
    ja: "願い事！！……言い忘れちゃった！",
    en: "A wish!! ...ah, I forgot to actually make one!",
  },
] as const satisfies readonly Line[];

/**
 * 願い事の直後だけ続ける一言。ひとりごとがふとこちらを向く瞬間なので、
 * 単独では出さない (単独で出すと引かれる)。
 */
export const WISH_FOLLOWUP = {
  ja: "あなたもお願いできました？",
  en: "Did you get your wish in too?",
} as const satisfies Line;

/**
 * 見ている人の状態への反応。
 *
 * 「空を見回した」「流れ星が 2 本同時」「鳥が 10 羽以上」はここから外して
 * ある ── どれも操作や偶然を実況するだけで、隣にいる人の言葉になっていない。
 * 数を数えて驚いてみせるより、同じ出来事に同じ調子で反応するほうがいい。
 */
export const STATE = {
  /** タブから戻ってきた */
  returned: {
    ja: "あ、戻ってきた！おかえりなさーい！",
    en: "Oh, you're back! Welcome baaack!",
  },
} as const satisfies Record<string, Line>;

/**
 * 長くいてくれた人へ。at は全画面に入ってからの秒数で、数えるのは実際に
 * 見ていた時間だけ (タブを離れている間は止まる)。
 *
 * **音量は上げない。**「！！！」→「！」→ 無し →「！」と落ちていく ──
 * 上げ続けると「時間とともに静かになる」と逆走するので、近づくのは距離の
 * ほうだけにする。最後の「！」はお礼のひと押しで、驚きの続きではない。
 *
 * 45 分は 0:30 の種明かしへの折り返し。「いつかこんな景色を見てみたくて、
 * つくりました。」で始まった願いが、ここで主語を増やして戻ってくる。
 * 語りはここで打ち止め ── 終わりがあるから最後の一言が最後になる。
 */
export const MILESTONES = [
  {
    at: 10 * 60,
    line: {
      ja: "まだいる！！！ もう友達ですね。",
      en: "You're STILL here!! I think we're friends now.",
    },
  },
  {
    at: 30 * 60,
    line: {
      ja: "30分！すごい。よく飽きないですね。\n……私も同じです。",
      en: "Thirty minutes! Wow. You really don't get bored, do you.\n...Same here, though.",
    },
  },
  {
    at: 45 * 60,
    line: {
      ja: "いつか、ほんとうにこんな景色を見に行けたらいいですね。",
      en: "I hope we get to see something like this for real someday.",
    },
  },
  {
    at: 60 * 60,
    line: {
      ja: "ありがとうございます。\n……なんか、そう言いたくなりました！",
      en: "Thank you.\n...I don't know, I just wanted to say that!",
    },
  },
] as const satisfies readonly { at: number; line: Line }[];

/**
 * 静かな時間の独り言。出来事ではなく「沈黙が続いたこと」がきっかけになる。
 *
 * 雲と天の川は反応の表にあるが、どちらも出来事として湧くものではなく
 * ずっとそこにある景色なので、こちら側から持ち出す。
 */
export const QUIET_TALK = {
  light: [
    { ja: "雲、ゆっくりだなあ。", en: "The clouds are so slow." },
    /** つくりものへの自己言及。独り言は 90 秒の沈黙が要るので、実際に出る
        のは種明かし (0:30) のずっと後 ── 先走って種を明かすことはない */
    { ja: "水平線、まっすぐすぎる。", en: "That horizon is way too straight." },
    /** 昼の主役は sceneConfig の CLOUD_LAYER 先頭の入道雲で、画枠 (HERO_FRAMING)
        はあれを収めるために組まれている。夜の主役 (天の川) に 1 行あるのに
        昼の主役が無口なのは不揃いなので、ここで名指しする。
        句切れは全角スペース。5・7・5 なので半角に潰さないこと */
    {
      ja: "ここで一句。\n真っ白な　もくもく雲が　めちゃデカい。",
      en: "Here's a haiku:\nPure white and fluffy / that big cloud piled over there / it's like, super huge.",
    },
  ],
  dark: [
    {
      ja: "天の川、見たことありますか？\nここなら、街の灯りがないからめちゃくちゃ綺麗に見えますね！！",
      en: "Have you ever seen the Milky Way?\nOut here there are no city lights, so it looks incredible!!",
    },
  ],
  /** 昼夜どちらでも */
  both: [
    /** 音の素材が入るまでの期間限定。足りないものを隠さず願いに変える。
        音が入ったらこの行だけ消すこと */
    {
      ja: "波の音も聞こえたらいいのになあ。",
      en: "I wish you could hear the waves too.",
    },
    /** 答えを求めない問いかけ。選択肢を出して答えさせるとチャットボットに
        なるので、投げたまま拾わない */
    {
      ja: "あなたは、どこから見てくれてるんでしょうか。",
      en: "I wonder where in the world you're watching this from.",
    },
    /** 黙っていられるほうが隣にいて心地よい ── この設計そのものを、
        本人の口から言わせる 1 行 */
    {
      ja: "なにも起きない時間って、けっこう好きです。",
      en: "I kind of love it when nothing happens.",
    },
    /** 見ている人の感じ方をこちらが決めない。ふと我に返るのは自分のほう */
    {
      ja: "あれ、もうこんなに経ってる。",
      en: "Huh. It's been that long already.",
    },
  ],
} as const satisfies Record<string, readonly Line[]>;

/**
 * 見ている人の現地時刻への反応。ブラウザから読めるので、相手の国の時間に
 * 反応できる ── 「全世界に見てほしい」がそのまま機能になる。
 * 昼間 (11〜17 時) に当てる言葉は持たないので、その時間帯は出さない。
 */
export const CLOCK_TALK = {
  morning: {
    ja: "そっちはもう朝ですか？ いいなあ。",
    en: "Is it morning where you are? Nice.",
  },
  night: { ja: "そっちも、もう夜ですか？", en: "Is it night where you are too?" },
  lateNight: {
    ja: "まだ起きてるんですか！？ 私もです。",
    en: "You're still up!? Same here.",
  },
} as const satisfies Record<string, Line>;

/** 静かにするボタン。ラベルは読み上げにも出るので、世界の言葉のまま */
export const CONTROL = {
  /** 今は話しているので、押すと黙る */
  quiet: { ja: "静かにする", en: "Quiet" },
  /** 今は黙っているので、押すと話す */
  talk: { ja: "話しかける", en: "Talk to me" },
  /** 黙らせたときの返事。元気に返してからピタッと止まる落差で、そのあとの
      静けさが際立つ */
  hushed: { ja: "わかりました、静かにします！", en: "Got it, I'll be quiet!" },
  /** 戻したときの返事 */
  resumed: {
    ja: "また話せるんですね！やったー！",
    en: "You'll talk to me again! Yesss!",
  },
} as const satisfies Record<string, Line>;
