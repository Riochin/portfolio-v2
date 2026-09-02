import type { WorkEntry } from "./types";

/**
 * 作品単位の制作物。レコードのキーが slug になり /works/[slug] の URL になる。
 *
 * 受賞は旧サイトのように 1 本の文字列に詰めず {event, prize, rank, sponsor} に分解する。
 * これにより getAwards() で作品横断の受賞一覧が導出できる。
 * date は旧データに無かったので、原則その作品の period.end を採用している。
 */
export const WORKS = {
  lsib: {
    title: {
      ja: "ラスサバ・イニブ 設置店舗マップ",
      en: "LSIB Arcade Map",
    },
    tagline: {
      ja: "戦場選びをサクッと10秒に ── 全国約770店舗を地図で探せる非公式マップ",
      en: "Pick your battleground in ten seconds — an unofficial map of ~770 arcades across Japan",
    },
    body: [
      {
        ja: "『ジョジョの奇妙な冒険 ラストサバイバー』と『機動戦士ガンダム EXTREME VS.2 INFINITEBOOST』の設置店舗を、全国約770店舗ぶん地図に載せた非公式サイト。ピンの色でどのタイトルが置いてあるかが一目でわかります。",
        en: "An unofficial site that maps roughly 770 arcades across Japan carrying JoJo's Bizarre Adventure: Last Survivor and Mobile Suit Gundam EXTREME VS.2 INFINITEBOOST. Pin colors show at a glance which title a venue has.",
      },
      {
        ja: "タイトル・都道府県／市区町村・店舗名・現在地で絞り込めるほか、台数や録画台・配信台・喫煙所といった「対戦前に知りたいこと」も店舗ごとに見られます。",
        en: "You can filter by title, prefecture and municipality, store name, or your current location, and each venue lists the things you want to know before heading out — cabinet count, recording and streaming setups, smoking areas.",
      },
      {
        ja: "データは公式サイトから自動更新し、ユーザーからの報告は確認のうえ反映。掲載店舗数・最終更新日時・出典を画面に明示しています。公開から約1か月で延べ3,300人以上に使われました。",
        en: "Data is refreshed automatically from the official sites, and user reports are reviewed before being applied. The venue count, last update time, and data sources are all shown on screen. Over 3,300 people used it in the first month or so after launch.",
      },
    ],
    category: "personal",
    period: { start: "2026-03", end: null },
    stack: [
      "typescript",
      "nextjs",
      "google-maps",
      "react",
      "tailwindcss",
      "sentry",
    ],
    image: {
      src: "/works/lsib.webp",
      width: 1200,
      height: 675,
      alt: {
        ja: "ラスサバ・イニブ 設置店舗マップ のスクリーンショット",
        en: "Screenshot of LSIB Arcade Map",
      },
    },
    links: {
      repo: "https://github.com/Riochin/ls-inib-map",
      demo: "https://lsib.world",
      slides:
        "https://speakerdeck.com/riochin/akedogemushe-zhi-dian-pu-saito-ge-ren-kai-fa-wu",
    },
    featured: true,
  },

  "exvs-command-trainer": {
    title: { ja: "EXVSコマンド道場", en: "EXVS Command Dojo" },
    tagline: {
      ja: "機動戦士ガンダム EXTREME VS. のコマンドを練習・確認できるWebアプリ",
      en: "A web app for drilling and looking up Mobile Suit Gundam EXTREME VS. commands",
    },
    body: [
      {
        ja: "機体ごとのコマンドを登録・編集し、練習モードで反復できるWebアプリ。対戦前の確認と手癖づけを1か所でできるようにしました。",
        en: "A web app where you register and edit per-unit commands and drill them in a practice mode, so checking your inputs and building muscle memory happen in one place.",
      },
    ],
    category: "personal",
    period: { start: "2026-04", end: null },
    stack: ["typescript", "nextjs", "turso", "drizzle", "authjs", "react"],
    image: {
      src: "/works/exvs-command-trainer.webp",
      width: 884,
      height: 590,
      alt: {
        ja: "EXVSコマンド道場 のスクリーンショット",
        en: "Screenshot of EXVS Command Dojo",
      },
    },
    links: {
      repo: "https://github.com/Riochin/exvs-command-trainer",
      demo: "https://exvs-command-trainer.vercel.app",
    },
  },

  "portfolio-v1": {
    title: { ja: "旧ポートフォリオサイト", en: "Portfolio (v1)" },
    tagline: {
      ja: "はじめて自分の名前で公開した、このサイトの前身",
      en: "The first site I published under my own name — the predecessor of this one",
    },
    body: [
      {
        ja: "Next.js と Tailwind CSS で組んだ初代のポートフォリオ。作品と経歴を1ページにまとめ、スクロールに合わせたアニメーションと問い合わせフォームを備えていました。",
        en: "The first portfolio I built, with Next.js and Tailwind CSS. It gathered my works and history on a single page, with scroll-triggered animation and a contact form.",
      },
      {
        ja: "作品データが自由な文字列のまま散らばっていたり、日英の段落数がずれていたりと、書き足すほど壊れやすくなったのが今のサイトを作り直した動機です。",
        en: "Work data lived as free-form strings scattered through the code, and the Japanese and English copy drifted apart paragraph by paragraph — the more I added, the more brittle it got, which is exactly why I rebuilt it as this site.",
      },
    ],
    category: "personal",
    period: { start: "2025-05", end: "2026-06" },
    stack: ["typescript", "nextjs", "react", "tailwindcss", "framer-motion"],
    image: {
      src: "/works/portfolio-v1.webp",
      width: 1200,
      height: 593,
      alt: {
        ja: "旧ポートフォリオサイト のスクリーンショット",
        en: "Screenshot of the old portfolio site",
      },
    },
    links: {},
  },

  "buyer-ai-vs-seller-ai": {
    title: { ja: "購入者AI vs 出品者AI", en: "Buyer AI vs Seller AI" },
    tagline: {
      ja: "値下げ交渉をまるごとAIに任せる ── 1つの購入者AIが、無数の出品者AIと同時に交渉する",
      en: "Hand the haggling to the AIs — one buyer agent negotiating with countless seller agents at once",
    },
    body: [
      {
        ja: "フリマの値下げ交渉には「文章を考えるのがめんどくさい」「どのくらい値切れる相手なのかわからない」「できるだけ早く結論を出したい」というハードルがあります。そこを購入者側・出品者側それぞれのAIエージェントに任せてしまうモックアプリです。",
        en: "Haggling on a marketplace has real hurdles: writing the message is a chore, you cannot tell how far a seller will bend, and you just want an answer quickly. This mock app hands the whole exchange to an AI agent on each side.",
      },
      {
        ja: "希望価格と自分のAIの性格を決めて送り出すと、あとは出品者のAIとその場でやり取りし、合意できたら「お知らせ」に届きます。伝え方を気にせず、複数の出品者と同時に交渉できるのが一番の狙いです。",
        en: "You set your target price and your agent's personality, then send it off; it trades offers with the seller's agent on the spot and drops a notification once they agree. The point is that you stop worrying about tone — and can negotiate with several sellers at the same time.",
      },
      {
        ja: "AIエージェントのハッカソンらしく、作り方の側もAIに寄せました。Figma MCP を繋いだアイデアボードで壁打ちし、Claude Design で全く違う3案のモックアップを並べて検証してから、Claude Code で実装しています。",
        en: "In the spirit of an AI agent hackathon, we leaned on AI for the making as well: bouncing ideas off a Figma-MCP-connected board, laying out three very different mockups in Claude Design to compare, and then writing the app with Claude Code.",
      },
    ],
    category: "hackathon",
    period: { start: "2026-08", end: "2026-09" },
    stack: ["typescript", "nextjs", "react"],
    links: {
      demo: "https://mercari-ai-hack-teamg.vercel.app/",
      slides:
        "https://speakerdeck.com/riochin/kounyuusha-ai-vs-shuppinsha-ai-mercari-ai-agent-hackathon",
    },
    image: {
      src: "/works/buyer-ai-vs-seller-ai.webp",
      width: 1200,
      height: 675,
      alt: {
        ja: "購入者AI vs 出品者AI のキービジュアル",
        en: "Key visual of Buyer AI vs Seller AI",
      },
    },
    awards: [
      {
        event: {
          ja: "Mercari AI Agent Hackathon",
          en: "Mercari AI Agent Hackathon",
        },
        prize: { ja: "優秀賞", en: "Excellence Award" },
        rank: "excellence",
        date: "2026-09",
      },
    ],
    featured: true,
  },

  nemmy: {
    title: { ja: "Nemmy", en: "Nemmy" },
    tagline: {
      ja: "せーので、「おやすみなさい」── 友達と一緒に睡眠習慣をつくるiOSアプリ",
      en: "Say goodnight together — an iOS app that builds a sleep habit with friends",
    },
    body: [
      {
        ja: "「寝るきっかけが生まれない」「睡眠習慣が続かず諦めてしまう」という課題に、友達と睡眠習慣を共有するという手段で応えたiOSアプリ。ロック画面から、いま何人が一緒に寝ているのかがわかります。",
        en: "An iOS app that answers two problems — nothing prompts you to go to bed, and a sleep habit never sticks — by sharing that habit with friends. From the lock screen you can see how many of them are already asleep.",
      },
      {
        ja: "就寝目標を決めると、達成できていないときはコンテンツを制限。1日1つの出来事を投稿してその日をふりかえり、友達の投稿にはスタンプを送れます。背景は時間帯に合わせて夜明けまで変わっていきます。",
        en: "Set a bedtime goal and the app restricts content while you are missing it. You post one moment from the day to look back on, send stamps to your friends' posts, and watch the background shift with the hour all the way to dawn.",
      },
      {
        ja: "チームでは、星空の美しい発光を Metal で描き、睡眠の深さと時間を HealthKit から取得しています。インフラは Terraform で組み、AWS の費用は月450円に収めました。",
        en: "As a team, we drew the glowing starfield with Metal and pulled sleep depth and duration from HealthKit. The infrastructure was defined in Terraform, and we kept the AWS bill to ¥450 a month.",
      },
    ],
    category: "hackathon",
    period: { start: "2026-08", end: "2026-08" },
    stack: ["swift", "swiftui", "go", "postgresql", "aws", "terraform"],
    links: {
      slides: "https://speakerdeck.com/riochin/nemmy-the-hack-2026",
    },
    image: {
      src: "/works/nemmy.webp",
      width: 1200,
      height: 675,
      alt: {
        ja: "Nemmy のキービジュアル",
        en: "Key visual of Nemmy",
      },
    },
    awards: [
      {
        event: {
          ja: "THE HACK 2026 大阪本戦",
          en: "THE HACK 2026 Osaka Final",
        },
        prize: { ja: "サイバーエージェント賞", en: "CyberAgent Award" },
        rank: "sponsor",
        sponsor: { ja: "サイバーエージェント", en: "CyberAgent" },
        date: "2026-08",
      },
      {
        event: {
          ja: "THE HACK 2026 東京予選",
          en: "THE HACK 2026 Tokyo Qualifier",
        },
        prize: { ja: "最優秀賞", en: "Grand Prize" },
        rank: "grand",
        date: "2026-08",
      },
    ],
    featured: true,
  },

  begit: {
    title: { ja: "BeGit;", en: "BeGit;" },
    tagline: {
      ja: "BeReal × GitHub — 開発者のための瞬間シェアSNS",
      en: "BeReal × GitHub — a moment-sharing SNS for developers",
    },
    body: [
      {
        ja: "BeRealの「通知が来たら今すぐ投稿！」の仕組みをGitHub×チーム開発に持ち込み、義務感になりがちなスタンドアップをゲームのような楽しさに変えました。",
        en: "Inspired by BeReal's post-the-moment-you-get-the-notification mechanic, brought into GitHub-based team development to make standups fun instead of a chore.",
      },
    ],
    category: "hackathon",
    period: { start: "2026-06", end: "2026-06" },
    stack: ["swift", "swiftui", "go", "github-oauth", "docker", "terraform"],
    links: {
      repo: "https://github.com/geekhackathon-vol3/BeGit",
      slides: "https://speakerdeck.com/riochin/begit-ji-yu-camp2026-vol-dot-3",
    },
    image: {
      src: "/works/begit.webp",
      width: 1200,
      height: 675,
      alt: {
        ja: "BeGit; のスクリーンショット",
        en: "Screenshot of BeGit;",
      },
    },
    awards: [
      {
        event: {
          ja: "技育CAMP ハッカソン 2026 vol.3",
          en: "Geek Camp Hackathon 2026 vol.3",
        },
        prize: { ja: "最優秀賞", en: "Grand Prize" },
        rank: "grand",
        date: "2026-06",
      },
    ],
    featured: true,
  },

  curio: {
    title: { ja: "Curio", en: "Curio" },
    tagline: {
      ja: "検索履歴から「好きになる前」の好奇心を可視化する",
      en: 'Visualize the trail of your curiosity "before you fall in love" from your browsing history',
    },
    body: [
      {
        ja: "Chrome拡張で閲覧履歴を自動収集し、AIが関心テーマを「ステッカー」として可視化するサービス。",
        en: "A service that automatically collects your browsing history via a Chrome extension and lets AI visualize your interests as stickers.",
      },
      {
        ja: "embedding＋pgvectorによるオンラインクラスタリングとfal.ai FLUX.1 [schnell]によるステッカー画像生成で、検索履歴を「偏愛のステッカーブック」に変えます。",
        en: "Using embeddings plus pgvector online clustering and fal.ai FLUX.1 [schnell] for sticker image generation, it turns search history into a sticker book of your obsessions.",
      },
      {
        ja: "同じステッカーを持つ他ユーザーと「好きになる前」の段階で偶然出会えるのが狙いです。",
        en: "The goal is to let you serendipitously meet others who passed through the same curiosity, before either of you had fallen for it.",
      },
    ],
    category: "hackathon",
    period: { start: "2026-05", end: "2026-05" },
    stack: [
      "typescript",
      "nextjs",
      "python",
      "postgresql",
      "pgvector",
      "chrome-extension",
    ],
    links: {
      repo: "https://github.com/engineer-guild-hackathon-2026-05/team-03",
      demo: "https://team-03-frontend.vercel.app",
      slides: "https://speakerdeck.com/riochin/curio-egh-2026",
    },
    image: {
      src: "/works/curio.webp",
      width: 1200,
      height: 676,
      alt: { ja: "Curio のスクリーンショット", en: "Screenshot of Curio" },
    },
    awards: [
      {
        event: {
          ja: "Engineer Guild Hackathon 2026",
          en: "Engineer Guild Hackathon 2026",
        },
        prize: { ja: "メルカリ賞", en: "Mercari Award" },
        rank: "sponsor",
        sponsor: { ja: "メルカリ", en: "Mercari" },
        date: "2026-05",
      },
    ],
    featured: true,
  },

  "tsuki-no-hayasa": {
    title: {
      ja: "突き(ラッシュ)の速さ比べか？",
      en: "Rush Speed Contest?",
    },
    shortTitle: {
      ja: "突きの速さ比べか？",
      en: "Rush Speed Contest?",
    },
    tagline: {
      ja: "Apple Watchのセンサーデータを使ったリアルタイム対戦ゲーム",
      en: "A real-time fighting game using Apple Watch sensor data",
    },
    body: [
      {
        ja: "Apple Watchのパンチ動作をセンサーで検知し、リアルタイムで対戦できるマルチプレイヤー格闘ゲーム。",
        en: "A real-time multiplayer fighting game where players punch with an Apple Watch as the input device.",
      },
      {
        ja: "WebTransportを介してRust製の低遅延同期サーバーと通信し、Web UI上でバトルがリアルタイム描画されます。",
        en: "The watch sends sensor data to a Rust-based low-latency sync server over WebTransport, and battles are rendered on a web UI in real time.",
      },
    ],
    category: "hackathon",
    period: { start: "2026-02", end: "2026-02" },
    stack: [
      "swift",
      "rust",
      "react",
      "kubernetes",
      "agones",
      "terraform",
      "aws",
    ],
    links: {
      repo: "https://github.com/progate-hackathon-enpower/andere-boxing",
      article: "https://topaz.dev/projects/978eda4ec50d77a73f15",
    },
    image: {
      src: "/works/tsuki-no-hayasa.webp",
      width: 1200,
      height: 800,
      alt: {
        ja: "突き(ラッシュ)の速さ比べか？ のスクリーンショット",
        en: "Screenshot of Rush Speed Contest?",
      },
    },
    awards: [
      {
        event: { ja: "第6回 58ハッカソン", en: "6th 58 Hackathon" },
        prize: { ja: "最優秀賞", en: "Grand Prize" },
        rank: "grand",
        date: "2026-02",
      },
    ],
    featured: true,
  },

  hinan: {
    title: { ja: "HiNan!", en: "HiNan!" },
    tagline: {
      ja: "歩いて避難訓練を習慣にするアプリ",
      en: "An app that makes evacuation drills a habit by walking",
    },
    body: [
      {
        ja: "AIが生成する災害シナリオに基づいて、実際に近くの避難所まで歩いて避難訓練ができるiOSアプリ。",
        en: "An iOS app where users receive AI-generated daily disaster scenarios and physically walk to nearby evacuation shelters for drill practice.",
      },
      {
        ja: "バッジ収集などのゲーミフィケーション要素で、避難訓練を楽しく習慣化できます。",
        en: "Gamification elements like collectible badges make evacuation drills fun and repeatable.",
      },
    ],
    category: "hackathon",
    period: { start: "2025-10", end: "2025-10" },
    stack: ["swift", "swiftui", "supabase", "gemini-api"],
    links: { repo: "https://github.com/jphacks/tk_a_2505" },
    image: {
      src: "/works/hinan.webp",
      width: 1200,
      height: 675,
      alt: { ja: "HiNan! のスクリーンショット", en: "Screenshot of HiNan!" },
    },
    awards: [
      {
        event: { ja: "JPHACKS Award Day", en: "JPHACKS Award Day" },
        prize: { ja: "ファイナリスト", en: "Finalist Award" },
        rank: "finalist",
        date: "2025-10",
      },
      {
        event: { ja: "JPHACKS", en: "JPHACKS" },
        prize: { ja: "川田テクノシステム賞", en: "Kawada Technosystem Award" },
        rank: "sponsor",
        sponsor: { ja: "川田テクノシステム", en: "Kawada Technosystem" },
        date: "2025-10",
      },
      {
        event: { ja: "JPHACKS", en: "JPHACKS" },
        prize: { ja: "ソフトバンク株式会社賞", en: "SoftBank Award" },
        rank: "sponsor",
        sponsor: { ja: "ソフトバンク株式会社", en: "SoftBank" },
        date: "2025-10",
      },
      {
        event: { ja: "JPHACKS", en: "JPHACKS" },
        prize: { ja: "ミーク株式会社賞", en: "Meek Award" },
        rank: "sponsor",
        sponsor: { ja: "ミーク株式会社", en: "Meek" },
        date: "2025-10",
      },
    ],
    featured: true,
  },

  postcard: {
    title: { ja: "Postcard", en: "Postcard" },
    tagline: {
      ja: "物流データが「風」になる！？飛ばされた投稿をキャッチするSNS",
      en: 'An SNS where logistics data becomes "wind" and you catch the posts it blows your way',
    },
    body: [
      {
        ja: "国土交通省が提供する『自動車輸送統計調査』の物流オープンデータを用いて、「風」のベクトルを作成しました。",
        en: "Wind vectors are derived from open logistics data — the Motor Vehicle Transport Statistics Survey published by Japan's Ministry of Land, Infrastructure, Transport and Tourism.",
      },
      {
        ja: "紙飛行機のように飛ばされた絵葉書をキャッチしよう！というコンセプトから開発しました。",
        en: "The concept: catch the postcards that drift to you like paper planes.",
      },
    ],
    category: "hackathon",
    period: { start: "2025-09", end: "2025-09" },
    stack: ["nextjs", "fastapi", "aws", "terraform", "ecr"],
    links: {
      repo: "https://github.com/Riochin/Postcard",
      article: "https://topaz.dev/projects/9d70dd666df36b317b20",
    },
    image: {
      src: "/works/postcard.webp",
      width: 1024,
      height: 1024,
      alt: {
        ja: "Postcard のスクリーンショット",
        en: "Screenshot of Postcard",
      },
    },
    awards: [
      {
        event: {
          ja: "Progate ハッカソン powered by ProjectLINKS & AWS",
          en: "Progate Hackathon powered by ProjectLINKS & AWS",
        },
        prize: { ja: "AWS賞", en: "AWS Award" },
        rank: "sponsor",
        sponsor: { ja: "AWS", en: "AWS" },
        date: "2025-09",
      },
    ],
  },

  gitris: {
    title: { ja: "GITRIS", en: "GITRIS" },
    tagline: {
      ja: "GitHub × TETRIS ！！日々の『積み上げ』を『積み上げ』て高得点を狙おう！",
      en: "GitHub × TETRIS!! Stack up your daily contributions to aim for a high score!",
    },
    body: [
      {
        ja: "GitHubのコントリビューションとテトリスを組み合わせたリアルタイム通信ゲーム！",
        en: "A real-time multiplayer game that combines GitHub contributions with Tetris.",
      },
      {
        ja: "日々のコーディング活動が楽しいゲーム体験に変わってほしいという思いから、開発しました。",
        en: "Built out of a wish to turn everyday coding activity into a fun gaming experience.",
      },
    ],
    category: "hackathon",
    period: { start: "2025-06", end: "2025-06" },
    stack: ["typescript", "react", "supabase", "go", "websocket"],
    links: {
      repo: "https://github.com/progate-hackathon-strawberry-flavor",
      demo: "https://gitris-frontend-deploy.vercel.app/",
      article: "https://topaz.dev/projects/cf32e19e255c3a38b6ab",
    },
    image: {
      src: "/works/gitris.webp",
      width: 300,
      height: 300,
      alt: { ja: "GITRIS のロゴ", en: "GITRIS logo" },
    },
    awards: [
      {
        event: {
          ja: "Progate Women's ハッカソン",
          en: "Progate Women's Hackathon",
        },
        prize: { ja: "優秀賞", en: "Excellence Award" },
        rank: "excellence",
        date: "2025-06",
      },
      {
        event: {
          ja: "Progate Women's ハッカソン",
          en: "Progate Women's Hackathon",
        },
        prize: { ja: "Studist賞", en: "Studist Award" },
        rank: "sponsor",
        sponsor: { ja: "Studist", en: "Studist" },
        date: "2025-06",
      },
    ],
    featured: true,
  },

  mokuhub: {
    title: { ja: "MokuHub", en: "MokuHub" },
    tagline: {
      ja: "エンジニアたちが「もくもく作業」を共有し、応援し合えるサービス",
      en: 'A service where engineers share their "mokumoku" focus sessions and cheer each other on',
    },
    body: [
      {
        ja: "Discord ActivityでリアルタイムにCommitを共有し、アプリ上で頑張りの記録を残せるようにしました。",
        en: "Commits are shared in real time through a Discord Activity, and the app keeps a record of the effort you put in.",
      },
    ],
    category: "hackathon",
    period: { start: "2025-05", end: "2025-05" },
    stack: ["typescript", "react", "discord"],
    links: {
      repo: "https://github.com/orgs/progate-hackathon-enpower/repositories",
      demo: "https://mokuhub.vercel.app/",
      article: "https://topaz.dev/projects/cb973dc2c7328144e63f",
    },
    image: {
      src: "/works/mokuhub.webp",
      width: 1200,
      height: 800,
      alt: { ja: "MokuHub のスクリーンショット", en: "Screenshot of MokuHub" },
    },
    awards: [
      {
        event: { ja: "第3回 58ハッカソン", en: "3rd 58 Hackathon" },
        prize: { ja: "優秀賞", en: "Excellence Award" },
        rank: "excellence",
        date: "2025-05",
      },
    ],
  },

  "exit-prog8": {
    title: { ja: "Prog-8版出口", en: "Exit Prog-8" },
    tagline: {
      ja: "『 このPr○gate、なんか変・・・？ 』コーディング中に起こる異変を見つけよう！",
      en: '"Something is off about this Pr○gate…?" Spot the anomalies that happen while you code!',
    },
    body: [
      {
        ja: "プログラミング学習中にさまざまな異変が起こる、8番出口ライクなプログラミング学習プラットフォーム。",
        en: "An 8-Exit-like learning platform where all sorts of anomalies appear while you are learning to program.",
      },
      {
        ja: "ゲーム面だけでなく、学べる内容にも力が入っています！",
        en: "We put as much care into what you actually learn as into the game itself.",
      },
    ],
    category: "hackathon",
    period: { start: "2025-04", end: "2025-04" },
    stack: ["typescript", "react", "supabase"],
    links: {
      repo: "https://github.com/2504-progate-hanami/exit-prog8",
      demo: "https://exit-prog8-vercel.vercel.app",
      article: "https://topaz.dev/projects/ccc1446d70a00e93ff2d",
    },
    image: {
      src: "/works/exit-prog8.webp",
      width: 1200,
      height: 903,
      alt: {
        ja: "Prog-8版出口 のスクリーンショット",
        en: "Screenshot of Exit Prog-8",
      },
    },
  },

  lunchjam: {
    title: { ja: "LunchJAM", en: "LunchJAM" },
    tagline: {
      ja: "『 食堂混みすぎ！ 』QRコードで入退室を記録し、食堂の混雑を緩和できるサービス",
      en: '"The cafeteria is way too crowded!" A service that eases congestion by logging entries and exits with QR codes',
    },
    body: [
      {
        ja: "食堂の混雑状況をリアルタイムで把握し、混雑を緩和するためのQRコードベースの入退室管理システム。",
        en: "A QR-code-based entry and exit management system that shows cafeteria congestion in real time and helps relieve it.",
      },
    ],
    category: "hackathon",
    period: { start: "2025-03", end: "2025-03" },
    stack: ["fastapi", "react", "firebase", "docker", "postgresql"],
    links: { repo: "https://github.com/Riochin/LunchJAM" },
    image: {
      src: "/works/lunchjam.webp",
      width: 1200,
      height: 834,
      alt: {
        ja: "LunchJAM のスクリーンショット",
        en: "Screenshot of LunchJAM",
      },
    },
    awards: [
      {
        event: {
          ja: "Waffle College ミニハッカソン",
          en: "Waffle College Mini Hackathon",
        },
        prize: { ja: "優秀賞", en: "Excellence Award" },
        rank: "excellence",
        date: "2025-03",
      },
    ],
    relatedExperience: "waffle-college",
  },

  imacalla: {
    title: { ja: "Imacalla", en: "Imacalla" },
    tagline: {
      ja: "暇人による暇人のための通話サービス",
      en: "A calling service by bored people, for bored people",
    },
    body: [
      {
        ja: "オンライン表示がなされるので、今まさに暇な人がわかるようになっています！",
        en: "Online presence is shown, so you can tell who is free right now.",
      },
      {
        ja: "ハッカソン中のデモでは大失敗しました。",
        en: "The live demo during the hackathon went spectacularly wrong.",
      },
    ],
    category: "hackathon",
    period: { start: "2024-12", end: "2025-01" },
    stack: ["typescript", "hono", "react", "gcp", "docker", "mysql"],
    links: {
      repo: "https://github.com/yomi4486/progate-andere-hackathon",
      article: "https://topaz.dev/projects/20a7255a23280cbb3a72",
    },
    image: {
      src: "/works/imacalla.webp",
      width: 538,
      height: 406,
      alt: {
        ja: "Imacalla のスクリーンショット",
        en: "Screenshot of Imacalla",
      },
    },
  },

  "gomen-nasai": {
    title: { ja: "ごめんなさい.com", en: "Gomen-nasai.com" },
    tagline: {
      ja: "謝罪文の添削・投稿・保存により、『まったく新しい謝罪体験』を提供するサービス",
      en: 'A service offering a "completely new apology experience" through correcting, posting, and saving apology letters',
    },
    body: [
      {
        ja: "Waffle Collegeの卒業ハッカソンで開発し、最優秀賞をいただくことができました。",
        en: "Built during the Waffle College graduation hackathon, where it won the Best Award.",
      },
    ],
    category: "hackathon",
    period: { start: "2024-12", end: "2025-01" },
    stack: ["html", "css", "javascript", "python", "flask"],
    links: {
      repo: "https://github.com/Riochin/Apology_work",
      slides:
        "https://speakerdeck.com/riochin/gomennasai-dot-com-waffle-college-zu-ye-hatukason",
    },
    image: {
      src: "/works/gomen-nasai.webp",
      width: 1200,
      height: 883,
      alt: {
        ja: "ごめんなさい.com のスクリーンショット",
        en: "Screenshot of Gomen-nasai.com",
      },
    },
    awards: [
      {
        event: {
          ja: "Waffle College 卒業ハッカソン",
          en: "Waffle College Graduation Hackathon",
        },
        prize: { ja: "最優秀賞", en: "Best Award" },
        rank: "grand",
        date: "2025-01",
      },
      {
        event: {
          ja: "Waffle College 卒業ハッカソン",
          en: "Waffle College Graduation Hackathon",
        },
        prize: { ja: "日本総研賞", en: "Japan Research Institute Award" },
        rank: "sponsor",
        sponsor: { ja: "日本総研", en: "Japan Research Institute" },
        date: "2025-01",
      },
    ],
    relatedExperience: "waffle-college",
    featured: true,
  },

  off: {
    title: { ja: "OFF", en: "OFF" },
    tagline: {
      ja: "バーゲンセールの場所がわかるモバイルアプリ！",
      en: "A mobile app that helps you find bargain sale locations!",
    },
    // 旧データの longDescription は tagline の言い換えしかなかったので本文は持たない
    body: [],
    // 旧データの date '2024.11 - 2025.12' は誤記。正しくは 2024.12 まで。
    category: "hackathon",
    period: { start: "2024-11", end: "2024-12" },
    stack: ["python", "fastapi", "aws", "dynamodb"],
    links: {
      repo: "https://github.com/progate-hackathon-party",
      article: "https://topaz.dev/projects/b63cb461d46c1bfc3ca4",
    },
    image: {
      src: "/works/off.webp",
      width: 1024,
      height: 1024,
      alt: { ja: "OFF のスクリーンショット", en: "Screenshot of OFF" },
    },
    awards: [
      {
        event: {
          ja: "Progateハッカソン powered by AWS",
          en: "Progate Hackathon powered by AWS",
        },
        prize: { ja: "優秀賞", en: "Excellence Award" },
        rank: "excellence",
        date: "2024-12",
      },
    ],
  },
} as const satisfies Record<string, WorkEntry>;

export type WorkSlug = keyof typeof WORKS;
