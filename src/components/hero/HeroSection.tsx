"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { revealTransition } from "@/lib/motion";
import { HeroBlock } from "./HeroBlock";
import { HeroFullscreen } from "./HeroFullscreen";
import { useWebGLSupported } from "./webgl";

export type HeroLabels = {
  /** 明暗で 1 語だけ違う挨拶文。どちらを見せるかは CSS が決める */
  readonly welcomeLight: string;
  readonly welcomeDark: string;
  readonly closer: string;
  readonly about: string;
  readonly expand: string;
  readonly close: string;
};

/** 挨拶文の 1 文字ずつの遅れ。globals.css の hero-welcome-char と対。 */
const CHAR_STAGGER_MS = 40;

/**
 * 何ミリ秒の滞在で全画面への誘いを出すか。
 *
 * デスクトップはホバーでも出るが (そちらは CSS)、スマホにホバーは無く
 * 来訪の大半がスマホなので、ホバーだけだと入口の案内が一度も出ない。
 * デバイスでは分岐させず、全デバイス共通でこの時間でも出す。
 */
const DWELL_MS = 10000;

/**
 * 挨拶文を折り返しの最小単位に切る正規表現。
 *
 * 1 文字ずつ inline-block に割ると、どの文字と文字のあいだにも折り返し
 * どころができてしまい、英文が `Welco / me` のように単語の途中で切れる。
 * 英字だけは単語のまとまりで取り (中で nowrap する)、それ以外は 1 文字ずつ
 * ── 日本語はどこで折り返しても読めるので、狭い画面では自由に折らせたい。
 */
const WORD = /[A-Za-z0-9'\u2019]+|[\s\S]/gu;

/**
 * 挨拶文 1 本ぶん。霞が晴れるように 1 文字ずつ結像させる。
 *
 * 明暗で 1 語だけ違う 2 本を重ねて置き、見せる側は CSS (dark:) に選ばせる。
 * next-themes の解決はクライアントでしか効かないので、JS で 1 本に絞ると
 * サーバの HTML は必ずライトになり、水和のあとに文字が入れ替わって見える。
 *
 * 消すのは display ではなく visibility。display:none の要素はアニメーションが
 * 取り消されるので、テーマを切り替えるたびに挨拶文が 1 文字ずつ出るところから
 * やり直しになる (円形リベールの最中に文字だけ消えて見える)。visibility なら
 * 箱は残るので走り終えたままで、読み上げにも選択にも乗らない。
 */
function Welcome({
  text,
  shown,
  className,
}: {
  text: string;
  /** 空が開ききったか。開いている途中の線と字を重ねない */
  shown: boolean;
  /** 明暗どちらで見せる側かを決めるクラス */
  className: string;
}) {
  let index = 0;

  return (
    <span className={`[grid-area:1/1] ${className}`}>
      {/* 1 文字ずつ span に割ると読み上げが文字単位になりうるので、
          支援技術には素の 1 文として渡し、見た目側は隠す。 */}
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {shown &&
          (text.match(WORD) ?? []).map((word, w) => {
            const chars = [...word];
            const delay = index * CHAR_STAGGER_MS;
            index += chars.length;

            // 単語のあいだの空白は素のテキストのまま置く。ここが唯一の
            // 折り返しどころになり、行末に来たぶんは中央揃えから外れて
            // 消えてくれる (inline-block の中に入れると幅を持ったまま残る)。
            return /\s/.test(word) ? (
              " "
            ) : (
              <span key={w} className="whitespace-nowrap">
                {chars.map((char, c) => (
                  <span
                    key={c}
                    className="hero-welcome-char"
                    style={
                      {
                        "--char-delay": `${delay + c * CHAR_STAGGER_MS}ms`,
                      } as CSSProperties
                    }
                  >
                    {char}
                  </span>
                ))}
              </span>
            );
          })}
      </span>
    </span>
  );
}

export function HeroSection({
  labels,
  aboutHref,
}: {
  labels: HeroLabels;
  /** ヒーローから次に見せたい 1 ページ。ロケール付きのパスで受け取る。 */
  aboutHref: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  // 一度でも全画面から戻ったか。戻りのモーフを挟む回だけ、ブロックは
  // Canvas を作るのを待つ
  const [returning, setReturning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // 展開する瞬間にブロックが描いていた 1 枚。モーフの下敷きに使う
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const captureRef = useRef<(() => string | null) | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const supportsWebGL = useWebGLSupported();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  // 静止画へ倒すのは WebGL が無いか、動きを減らす設定のときだけ。どちらも
  // まだ分からない間(サーバと水和の 1 回目)は無地で、どちらにも倒さない。
  const still =
    supportsWebGL === false || prefersReducedMotion === true || failed;
  // resolvedTheme が決まる前に始めると、暗いテーマでも一度昼の空を
  // 組み立ててから夜へ切り替わってしまう。
  const live = supportsWebGL === true && !still && Boolean(resolvedTheme);
  // 読み込みの間、ブロックは出さず中央の線だけが見えている。挨拶文もその線と
  // 重ねず、空が開ききってから出す(1 文字ずつの出現もそこで見せたい)。
  const shown = still || revealed;
  // 全画面へ開けるか。動きを減らす設定ではモーフごと畳んであるので開かない。
  const canExpand = prefersReducedMotion === false;
  // 全画面への誘いを出す頃合い。ホバー (デスクトップ) は CSS が持つので、
  // JS が数えるのは滞在のほうだけ。
  const [dwelled, setDwelled] = useState(false);

  const close = useCallback(() => {
    setReturning(true);
    setIsExpanded(false);
  }, []);
  const onRevealed = useCallback(() => setRevealed(true), []);
  const onFailed = useCallback(() => setFailed(true), []);
  const onCapture = useCallback((capture: () => string | null) => {
    captureRef.current = capture;
  }, []);

  const expand = useCallback(() => {
    // まだ絵が出ていない間の Canvas は組み立ての途中で、撮っても意味のある
    // 絵にならない。その場合は下敷きなしで無地から展開する。
    setSnapshot(revealed ? (captureRef.current?.() ?? null) : null);
    setIsExpanded(true);
  }, [revealed]);

  // 数え始めは空が開ききってから。読み込みに時間がかかった画面では、絵と
  // ほぼ同時に案内まで出ることになり、1 文字ずつ出ている挨拶文と重なって
  // 騒がしい。一度出したら引っ込めない (案内は消えるものではない)。
  useEffect(() => {
    if (!shown || dwelled) return;
    const timer = setTimeout(() => setDwelled(true), DWELL_MS);
    return () => clearTimeout(timer);
  }, [shown, dwelled]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded, close]);

  return (
    <LayoutGroup>
      {/* フローに置くのはブロックだけ。挨拶文も下の導線も absolute でブロックに
          吊るす。フローに残すと 3 つの合計が画面の中央に揃ってしまい、ブロック
          自身はそのぶん上へずれる (About への導線を足したときに起きたのがこれ)。

          --hero-reserve はブロック以外がこの画面で使う高さ。ブロックを画面の
          中央に置く以上、上下には必ず同じだけ空くので、厳しい方の 2 倍を取る。

            下 = 7.5rem (テーマ切替: bottom-10 の 2.5rem + h-16 の 4rem に
                         ひと呼吸 1rem) + 3.5rem (導線の行 1.5rem + 間隔 2rem)
               = 11rem
            上 = 3.875rem (モバイルのヘッダー: py-4 + 行 1.875rem)
                 ※ 挨拶文はブロックに重なるので数えない。md 以上はヘッダーも
                   無いので 0

          下が厳しいので 11rem x 2 = 22rem。モバイルと md で同じ値になるため
          1 つで足りる。導線の行の 1.5rem は min-h-6 と対で、文字サイズの
          スケール (globals.css の @theme) を触ったらここも一緒に見直す。

          short (縦 31rem 未満) だけは page 側が余白で居場所を作り、中央では
          なくその余白の中に据える。上下が非対称になるぶん倍を取らずに済み、
          天の余白を pt、地を pb とすると h <= 100dvh - 14.5rem - pt。
          md 以上は pt が 0 なので 14.5rem、モバイルはヘッダーぶん 3.875rem を
          足して 18.5rem (端数は切り上げ)。

          ここに出てくる数はどれもブロック以外の高さなので、ブロックの比を
          16:9 から 4:3 へ変えても動かない。高さで頭を押さえられている画面では
          h = 100dvh - 22rem がそのまま出て、上下に 11rem ずつ残る ── 比を
          変えても等号は成り立ったままで、22rem / 18.5rem / 14.5rem は据え置き。
          比が効くのは幅のほうで、幅で決まる高さ (w * 3/4) が予算を超えたときに
          初めて下の max-w が働く。iPhone SE (375x667) は short ではないので
          予算は 100dvh - 22rem = 315px、幅は 375 - px-6 の 48 = 327px、
          4:3 の高さは 245px で予算の内に収まる。 */}
      <div className="relative w-full max-w-3xl [--hero-reserve:22rem] max-md:short:[--hero-reserve:18.5rem] md:short:[--hero-reserve:14.5rem]">
        {/* 挨拶文は水平線より下、海の上に重ねる。空には雲が湧くので、字が乗る
            のは面の落ち着いた水側がいい。

            水平線の高さはカメラから出る。画面の中央からの隔たりは
            tan(pitch) / (2 * tan(fov/2)) で、既定 (pitch 0.055 / fov 55) なら
            ブロックの上から 55.3%。この式に比が入っていないのは、three の fov が
            垂直基準で、枠を 16:9 から 4:3 へ詰めても縦の見え方が動かないため。
            画枠を変えても水平線は 55.3% のままなので、この 22% も据え置ける
            (fov を触ったときだけ動く。55→62 なら 54.6%)。
            字の中心はその下の 61% に置く (top を 22%
            にすると、下辺との中点がちょうど 61%)。字の高さの半分が 3% ほどな
            ので、上辺と水平線の間はまだ空く。ポインタ追従で pitch は ±0.12
            振れ、上を向ききると水平線が 67% まで下がって字を越すが、それは
            見回している間だけの一瞬で、据わりの良さを取った。
            sceneConfig の CAMERA か POINTER_LOOK を触ったらここも計算し直す。

            色はテーマによらず白。昼は海面に日のギラつきの帯が出て白と
            白がぶつかるので、輪郭を拾わせる影は残す。ただし下向きの
            オフセットを持たせると字だけが絵から浮いて「貼り付けた」ように
            見えるので、中心対称の淡いハロー 1 本だけにする。
            狭い幅ではブロックも小さいので、字を一回り落として左右に逃げを作り、
            それでも入らなければ折り返させる (中央揃えなので 2 行でも崩れない)。

            日本語は 17 字ぶんが 1 行に載るかどうかの瀬戸際にある。字 (1em) と
            字間 (0.2em) で 1 字 1.2em なので、text-xs (このサイトでは 13px) なら
            17 字で 265px ── 使える幅は 画面幅 - 80px (ページの px-6 と h1 の
            px-4) だから、345px から上は 1 行で持つ。ここを text-sm (16px) に
            上げると必要な幅が 326px になり、375px の画面で「へ。」だけが 2 行目に
            残る。英語は 46 字あってどのみち折り返すが、単語のまとまりで折れる
            (WORD の説明を参照)。
            pointer-events-none にして、文字の上でもブロックを押せるようにする。

            明暗の 2 本を同じ 1 マスに重ね、grid で両方を中央に置く。flex だと
            2 本が横に並ぶので、ここだけ grid にしてある。見せる側を選ぶのは
            CSS で、どちらが出ても行の位置は動かない (Welcome の説明も参照)。 */}
        {!isExpanded && (
          <h1 className="pointer-events-none absolute inset-x-0 bottom-0 top-[22%] z-10 grid place-items-center px-4 text-center text-xs font-medium tracking-[0.2em] text-white [text-shadow:0_0_12px_rgb(0_0_0/0.3)] md:text-sm">
            <Welcome
              text={labels.welcomeLight}
              shown={shown}
              className="dark:invisible"
            />
            <Welcome
              text={labels.welcomeDark}
              shown={shown}
              className="invisible dark:visible"
            />
          </h1>
        )}
        {/* aspect は幅からしか高さを決めないので、低い画面 (横向きの端末など) では
            ブロックだけで画面を越えてしまう。残り高さから逆算した幅で頭を押さえ、
            比を保ったまま縮ませる。max() は予算が尽きたときに幅が 0 や負に
            なって消えないための下限。max-w の係数は必ず aspect と同じ比にする
            (ここが食い違うと、高さで押さえた側の枠だけが別の比になる)。

            upright (狭い縦長の画面) だけ 4:3 に詰める。横長の枠を縦長の画面に
            置くと、絵が細い帯になって主役の入道雲の背丈が出ない。比を変えても
            縦の見え方は動かず横だけが切れるので、切れたぶんはカメラの yaw で
            取り戻す ── その対は sceneConfig の HERO_FRAMING が持っている。 */}
        <div className="group relative mx-auto aspect-[16/9] w-full max-w-[calc(max(9rem,100dvh-var(--hero-reserve))*16/9)] upright:aspect-[4/3] upright:max-w-[calc(max(9rem,100dvh-var(--hero-reserve))*4/3)]">
          {!isExpanded && (
            <HeroBlock
              onClick={prefersReducedMotion || !shown ? undefined : expand}
              disabled={!shown}
              ariaLabel={labels.expand}
              mode={mode}
              live={live}
              still={still}
              underlay={snapshot}
              returning={returning}
              inviting={dwelled && canExpand}
              onCapture={onCapture}
              onRevealed={onRevealed}
              onFailed={onFailed}
            />
          )}
          {/* 全画面への誘い。ブロックの中、海の上に置く ── 枠も背景も付けない。
              囲った瞬間にボタンという UI 部品になって、世界の中の言葉ではなく
              なる。行き先は「全画面表示」ではなく「近づく」で言う。

              出す条件は 2 つで、どちらでも同じ言葉が同じ尺で出る。
                ・ホバー (group-hover) ── カーソルが近づいたら言葉が現れる、で
                  所作と意味が一致する。タッチでは :hover が付かないので、
                  デバイスを見て分岐する必要がない
                ・滞在 (data-near) ── ホバーの無い端末でも案内が届くように

              尺と曲線は revealTransition が 1 箇所で持つ。あとで足すナビの
              ホバーと完全に揃っている必要があるので、クラス名で書かない。
              押せるのはブロック自身なので pointer-events-none で通す
              (この span がホバーを奪うと、出た瞬間に消えて明滅する)。

              出すのは空が開ききってから、かつ押せば開く回だけ。読み込みの
              最中はまだ押せないし、押しても開かない回 (動きを減らす設定) も
              あって、どちらも近づけないのに誘うことになる。 */}
          {!isExpanded && shown && canExpand && (
            <span
              aria-hidden
              data-near={dwelled ? "" : undefined}
              style={revealTransition}
              // 12px は @theme のスケールに無い値。挨拶文 (text-xs = 13px) より
              // さらに一段落としたいが、下にもう段が無いので直に書く。
              className="pointer-events-none absolute inset-x-0 bottom-[7%] z-10 px-4 text-center text-[0.75rem] tracking-[0.2em] text-white/85 opacity-0 transition-opacity [text-shadow:0_0_12px_rgb(0_0_0/0.3)] group-hover:opacity-100 motion-reduce:transition-none data-[near]:opacity-100"
            >
              {labels.closer}
            </span>
          )}
        </div>
        {/* ヒーローは 1 画面で閉じていてスクロールの続きが無いので、「↓」は
            置かない (ブロック自体が押せるので、押すのか送るのかも紛れる)。
            行き先を名乗るリンクにして、空が開ききってから遅れて出す。
            top-full = ブロックの下辺。フローに置かないので、この行が出ても
            ブロックは動かない (中央に据わったまま)。 */}
        {!isExpanded && (
          <div className="absolute inset-x-0 top-full mt-8 flex min-h-6 justify-center">
            {shown && (
              <Link
                href={aboutHref}
                className="reveal-rise inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
                // 挨拶文が 1 文字ずつ出そろうのを待ってから
                style={{ "--reveal-delay": "1000ms" } as CSSProperties}
              >
                {labels.about}
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <HeroFullscreen
            mode={mode}
            still={still}
            snapshot={snapshot}
            onClose={close}
            closeLabel={labels.close}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
