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
      ja: "戦場選びをサクッと10秒に ── 全国約770店舗を地図で探せる非公式ゲーセンマップ",
      en: "Pick your battleground in ten seconds — an unofficial map of ~770 arcades across Japan",
    },
    summary: [
      {
        ja: "私は対戦アーケードゲームが好きで、よく友達とゲーセンで遊んでいます。ただ、店舗選びには台数や録画台の有無、最寄駅などを意識する必要があり、調べ回るのがいつも大変でした。",
        en: "I love competitive arcade games and often play at arcades with friends. But picking a venue means checking how many cabinets it has, whether there's a recording setup, the nearest station, and more, and hunting all that down was always a hassle.",
      },
      {
        ja: "そこで、視覚的に店舗や台数がわかるサイトがあれば楽なんじゃないか？と考えて、このサイトを作りました。データは公式サイトから自動で更新し、ユーザーからの報告は確認してから反映しています。",
        en: "So I thought: wouldn't it be easier with a site that shows venues and cabinet counts at a glance? That's how this site came about. Data is refreshed automatically from the official sites, and user reports are reviewed before being applied.",
      },
      {
        ja: "公開後も告知と SEO を続けて、公開から5ヶ月が経った11月時点で、毎日100~150人の方に使っていただいています。",
        en: "I've kept promoting it and working on SEO since launch, and as of November, five months in, 100–150 people use it every day.",
      },
    ],
    retro: [
      {
        ja: "はじめはよく一緒に遊ぶ身内向けのサイトだったのですが、エンジニアの友達の「公開しないのはもったいない」という一言に押されて公開しました。",
        en: "It started as a site just for the friends I usually play with, but an engineer friend told me it would be a waste not to publish it, and that pushed me to make it public.",
      },
      {
        ja: "公開すると想像以上の反響がありましたが、当時はまだ関東地方しかカバーできておらず、「大阪も待ってます」「愛知も見れるようになったら嬉しい」といった声がすぐに集まりました。ユーザーから直接フィードバックをもらえたのがとても嬉しく、一晩で全国版を作ってリリースしました。",
        en: "The response was bigger than I expected. At the time it only covered the Kanto region, and requests like \"Osaka is waiting!\" and \"I'd love to see Aichi too\" came in right away. Getting feedback straight from users made me so happy that I built and released the nationwide version overnight.",
      },
      {
        ja: "どうやってユーザーに「届く」プロダクトにしたのかは[こちらのLT資料](https://speakerdeck.com/riochin/ta-tai-ni-raseru-tenpo-jouhou-saito-o-todokeru-tame-ni-yata-tsu-no-koto)で詳しく話しているので、興味を持った方はぜひご覧ください！！",
        en: "I go into how I made it a product that actually reaches users in [this LT deck](https://speakerdeck.com/riochin/ta-tai-ni-raseru-tenpo-jouhou-saito-o-todokeru-tame-ni-yata-tsu-no-koto) (in Japanese), so take a look if you're interested!",
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
      ja: "スマホがコントローラーになる、『機動戦士ガンダム EXVS2』のコマンド練習ツール",
      en: "A command trainer for Mobile Suit Gundam EXVS2 that turns your phone into the controller",
    },
    summary: [
      {
        ja: "『機動戦士ガンダム EXVS2』シリーズは10年以上続くアーケードゲームで、250体以上のモビルスーツが実装されています。",
        en: "The Mobile Suit Gundam EXVS2 series is an arcade game that has run for over ten years, with more than 250 mobile suits.",
      },
      {
        ja: "対戦の基本になる操作やコマンドは複数あり、機体ごとに使える技も違いますが、練習するには実際の店舗に足を運ぶしかありません。",
        en: "There are many basic inputs and commands to learn, and every suit has its own moves, yet the only way to practice was to go to an actual arcade.",
      },
      {
        ja: "そこで、スマホにほぼ実寸大のコントローラーを、PC に画面を表示し、2つの端末が通信することで、家でも実際に近い操作感でコマンドを練習できるアプリを開発しました。",
        en: "So I built an app where your phone shows a nearly life-size controller and your PC shows the game screen. The two devices talk to each other, so you can practice commands at home with a feel close to the real thing.",
      },
    ],
    retro: [],
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

  "portfolio-v2": {
    title: { ja: "このポートフォリオサイト", en: "Portfolio (v2)" },
    tagline: {
      ja: "今見ているこのサイト！初代のコンセプトそのままに、よりわかりやすく",
      en: "The site you're looking at! Same concept as the first one, now easier to find your way around",
    },
    summary: [
      {
        ja: "2025年5月に制作した初代サイトはアニメーションが多い1ページのサイトで、見ていて目が疲れるうえに、情報も整理しきれていない印象がありました。",
        en: "My first site, made in May 2025, was a single page full of animation. It was tiring on the eyes, and the information never felt fully organized.",
      },
      {
        ja: "そこで、わかりやすさと世界観にこだわって2026年9月にリニューアルしたのがこのサイトです。リニューアルにあわせて[登壇資料とブログを載せるページ](/output)を新しく作り、markdownエディタも作って、記事を書くところから公開までをこのサイトの中で完結させました。",
        en: "So in September 2026 I rebuilt it with a focus on clarity and atmosphere. Along with the renewal I added [a page for my talks and blog posts](/output) and built a Markdown editor, so everything from writing an article to publishing it happens inside this site.",
      },
      {
        ja: "なかでも[サイトトップ](/)は夏の思い出と余白を意識していて、お気に入りのページになっています。（私が喋り出す小ネタも入っています！）",
        en: "[The top page](/) in particular is built around summer memories and open space, and it's my favorite page. (There's also a little easter egg where I start talking!)",
      },
    ],
    retro: [
      {
        ja: "好きなテーマは星空、青空、そして海。好きな色は紫、紺、ピンク、水色。そんな私の好きな雰囲気を、とにかく詰め込んだサイトです。",
        en: "My favorite themes are starry skies, blue skies, and the sea. My favorite colors are purple, navy, pink, and light blue. I packed as much of that atmosphere as I could into this site.",
      },
      {
        ja: "開くと最初に WebGL の景色が出るので、ぱっと見では誰のサイトか分かりにくいと思います。が、実はそれ自体がこだわりです。自分を前に出しすぎず、「私が大切にしている世界観」と「私がつくってきたもの」をまず見てもらいたいと考えました。そのうえで「どんな人なんだろう？」と興味を持ってくれた方に、[About](/about)や[ブログ](/output)のページも見てもらえたら嬉しいと思っています。",
        en: "The first thing you see is a WebGL scene, so at a glance it's hard to tell whose site this is. That's actually intentional. Instead of putting myself front and center, I wanted visitors to first see the world I care about and the things I've made. Then, if you find yourself wondering what kind of person made it, I'd be glad if you looked at [About](/about) and [the blog](/output) too.",
      },
    ],
    category: "personal",
    period: { start: "2026-09", end: null },
    stack: [
      "typescript",
      "nextjs",
      "react",
      "tailwindcss",
      "framer-motion",
      "threejs",
    ],
    image: {
      src: "/works/portfolio-v2.webp",
      width: 1200,
      height: 603,
      alt: {
        ja: "このポートフォリオサイト のスクリーンショット",
        en: "Screenshot of this portfolio site",
      },
    },
    links: {
      repo: "https://github.com/Riochin/portfolio-v2",
      demo: "https://riochin.dev",
    },
  },

  "portfolio-v1": {
    title: { ja: "旧ポートフォリオサイト", en: "Portfolio (v1)" },
    tagline: {
      ja: "はじめて自分の名前で公開したポートフォリオ",
      en: "The first portfolio I published under my own name",
    },
    summary: [
      {
        ja: "2025年5月に、はじめて自分の名前で公開したポートフォリオです。",
        en: "Published in May 2025, this was the first portfolio I put out under my own name.",
      },
      {
        ja: "Next.js と Tailwind CSS で、作品と経歴を1ページにまとめ、スクロールに合わせたアニメーションと問い合わせフォームを付けました。",
        en: "Built with Next.js and Tailwind CSS, it put my works and background on a single page, with scroll-driven animations and a contact form.",
      },
      {
        ja: "まだ公開自体はされてるはずなので、リンク先からぜひ！",
        en: "It should still be online, so check it out from the link!",
      },
    ],
    retro: [
      {
        ja: "[Prog-8版出口](/works/exit-prog8)でデプロイへの抵抗感がなくなり、「じゃあ自分のサイトを持ちたい！」と思ったのが始まりです。",
        en: "After [Exit Prog-8](/works/exit-prog8) got me over my fear of deploying, I thought, \"Then I want a site of my own!\" That's how this started.",
      },
      {
        ja: "問い合わせフォームは EmailJS で作っていましたが、管理が思ったより面倒でした。それに、問い合わせはそれほど来ないのに、誰でも送信できる入力欄を置いたままにして、何度も送信される危険を抱え続けるのも怖くなりました。そこで今のサイトでは、フォームをやめて[About ページ](/about)にメールアドレスを載せています。",
        en: "The contact form used EmailJS, but it was more of a hassle to manage than I expected. I also got uneasy about keeping a form anyone could submit, with the risk of it being hit over and over, when hardly any messages came in anyway. So on the current site I dropped the form and put my email address on [the About page](/about).",
      },
      {
        ja: "星空と紫色はこの頃から大好きで、今のサイトにもナイトモードのモチーフとして引き継いでいます。",
        en: "I already loved starry skies and purple back then, and they carry over to the current site as the motif of night mode.",
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
    links: {
      demo: "https://portfolio-olive-phi-42.vercel.app",
    },
  },

  yorido: {
    title: { ja: "Yorido", en: "Yorido" },
    tagline: {
      ja: "陰謀論の話で大切な人とすれ違ってしまう人のための、関わり方のヒントと相談先の案内",
      en: "Ways to stay connected and places to get support, for people drifting apart from loved ones over conspiracy theories",
    },
    summary: [
      {
        ja: "身近な人が陰謀論にのめり込んでしまい、どう接すればいいか悩む「支える側」のためのWebアプリです。状況に合わせて、関わり方のヒント、近い状況の記事や本、電話で相談できる窓口を案内します。論破や説得ではなく、ひとりで抱え込まないための最初の一歩を目指しました。",
        en: "A web app for the people on the supporting side: those whose family or friends have fallen into conspiracy theories and who don't know how to respond. Based on their situation, it suggests ways to engage, articles and books about similar cases, and phone lines where they can talk to someone. The goal isn't to win arguments or change minds, but to be a first step so no one has to carry this alone.",
      },
    ],
    retro: [
      {
        ja: "Code for Japanが運営するTOMODACHI Boeing Entrepreneurship Seminar 2026の、2ヶ月間のプログラムで開発しました。",
        en: "Built during the two-month TOMODACHI Boeing Entrepreneurship Seminar 2026 program run by Code for Japan.",
      },
      {
        ja: "今回は初対面のメンバーとの2ヶ月間で、全員が常にフル稼働できる状態ではありませんでした。その中で、いかにチームビルディングと仕組みづくりをしておくかが鍵だと考えて臨みました。その一環として、GitHub ProjectsとDiscordサーバーを整え、各種ツールのオンボーディングにも力を入れ、これらがうまく噛み合って、プログラムを最後まで走り切ることができました。",
        en: "We were people meeting for the first time, working together for two months, and not everyone could be fully available all the time. So I went in believing the key was to set up team building and working structures early. As part of that, I set up GitHub Projects and our Discord server and put effort into onboarding everyone to our tools. It all came together, and we made it through the program to the end.",
      },
      {
        ja: "結果、チームとしてBest Overall Awardを受賞し、個人としても米国研修メンバーに選抜していただきました！",
        en: "In the end our team won the Best Overall Award, and I was also selected individually for the U.S. training program!",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "TOMODACHI Boeing Entrepreneurship Seminar 2026", en: "TOMODACHI Boeing Entrepreneurship Seminar 2026" },
      teamSize: 4,
      start: "2026-09-11",
      end: "2026-11-07",
    },
    role: { ja: "PM・エンジニア", en: "PM / Engineer" },
    stack: ["react", "tailwindcss", "cloudflare"],
    links: {
      demo: "https://yorido.app",
    },
    image: {
      src: "/works/yorido.webp",
      width: 1200,
      height: 675,
      alt: {
        ja: "Yorido のタイトル画面",
        en: "Yorido title screen",
      },
    },
    awards: [
      {
        event: {
          ja: "TOMODACHI Boeing Entrepreneurship Seminar 2026",
          en: "TOMODACHI Boeing Entrepreneurship Seminar 2026",
        },
        prize: { ja: "Best Overall Award", en: "Best Overall Award" },
        rank: "grand",
        date: "2026-11",
        day: "07",
      },
    ],
    featured: true,
  },

  iubeo: {
    title: { ja: "IUBEO", en: "IUBEO" },
    tagline: {
      ja: "AIと人間の立場が逆転した世界で、AIエージェントとして働く3人協力アクションゲーム",
      en: "A three-player co-op action game where you work as an AI agent in a world where AI and humans have swapped places",
    },
    summary: [
      {
        ja: "現実のAIと人間の立場が逆転した、真っ白な世界。プレイヤーはエージェントとして、姿の見えない「彼ら」から渡されるタスクをこなしていきます。",
        en: "An all-white world where AI and humans have traded places. Players work as agents, clearing tasks handed down by an unseen \"them\".",
      },
      {
        ja: "タスクはAIエージェントのツールコールになぞらえた Read + Edit・Write・Web Search・Image Generation の4種類。3人はボイスチャットで声をかけ合いながら中央のディレクトリからファイルを取り合い、フェーズごとのタスクを期限内に満たします。満たせなかったプレイヤーは「彼ら」によってデリートされます。",
        en: "Tasks come in four kinds modeled on an AI agent's tool calls: Read + Edit, Write, Web Search, and Image Generation. The three players talk over voice chat while competing for files in the shared directory at the center, racing to clear each phase's tasks before the deadline. Anyone who falls short gets deleted by \"them\".",
      },
      {
        ja: "ゲーム内PCのブラウザには Firefox のエンジン (Gecko) を WebAssembly にしたものを載せ、検索結果がお題に合っているかは Workers AI のモデル（Clef）が判定します。3D は React Three Fiber の WebGPU レンダラーで描いています。",
        en: "The in-game PC's browser runs Firefox's engine (Gecko) compiled to WebAssembly, and Clef, a Workers AI model, judges whether a search result fits the prompt. The 3D world is drawn with React Three Fiber's WebGPU renderer.",
      },
    ],
    retro: [
      {
        ja: "圧倒的に技術力の高いメンバーに誘われて出たハッカソンでした。私はこれまで、コンセプトやプレゼン、チームワークなどを武器にハッカソンに出ることが多かったので、メンバーの得意・不得意がピタッとハマるバランスのチームでした。",
        en: "I joined this hackathon at the invitation of teammates with overwhelming technical skill. Until then I'd mostly competed with concept, presentation, and teamwork as my strengths, so our strengths and weaknesses fit together perfectly.",
      },
      {
        ja: "とはいえ、それで実装をしないのではだめだと思い、Go バックエンドの通信部分に責任を持ちました。フロントエンド担当と設計を確認しながら、どのデータを通信中に持つか・持たないかを入念にすり合わせました。このすり合わせのおかげで、メンバー全員がゲームの仕様をよく理解でき、かなり完成度の高い作品ができたと思っています！",
        en: "Still, I knew it wouldn't do for me not to build anything, so I took ownership of the networking part of the Go backend. Checking the design with our frontend developer, I carefully worked out which data to keep during communication and which not to. Thanks to that, everyone understood the game's spec well, and I think we made a really polished game!",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "JOGIHACK 2026", en: "JOGIHACK 2026" },
      teamSize: 3,
      start: "2026-09-19",
      end: "2026-10-17",
    },
    role: { ja: "バックエンド", en: "Backend" },
    stack: ["go", "typescript", "react", "threejs", "websocket", "terraform"],
    links: {
      repo: "https://github.com/jogi-hackathon/iubeo",
      article: "https://topaz.dev/projects/uo9xmdy6ocsx7kpi",
    },
    image: {
      src: "/works/iubeo.webp",
      width: 1200,
      height: 800,
      alt: {
        ja: "IUBEO のロゴ",
        en: "IUBEO logo",
      },
    },
    awards: [
      {
        event: { ja: "JOGIHACK 2026", en: "JOGIHACK 2026" },
        prize: { ja: "最優秀賞", en: "Grand Prize" },
        rank: "grand",
        date: "2026-10",
        day: "17",
      },
    ],
    featured: true,
  },

  "buyer-ai-vs-seller-ai": {
    title: { ja: "購入者AI vs 出品者AI", en: "Buyer AI vs Seller AI" },
    tagline: {
      ja: "値下げ交渉をまるごとAIに任せちゃおう！",
      en: "Leave the whole price negotiation to AI!",
    },
    summary: [
      {
        ja: "フリマの値下げ交渉は、文章を考えるのが面倒で、相手がどこまで値切れるかもわからず、早く結論を出したいのに時間がかかります。",
        en: "Haggling on a flea-market app is a chore: you have to write the messages, you can't tell how far the other side will go, and it drags on when you just want an answer.",
      },
      {
        ja: "そこを購入者・出品者それぞれの AI に任せ、1つの購入者 AI が複数の出品者と同時に交渉できるようにしました。",
        en: "We hand that off to an AI for the buyer and one for each seller, so a single buyer AI can negotiate with several sellers at once.",
      },
    ],
    retro: [
      {
        ja: "2日間のハッカソンで、開発経験の少ないメンバーも多かったので、Figma MCP や Claude Design のような使い始めやすいプロトタイピングツールで、チームの認識を合わせられるように意識しました。",
        en: "It was a two-day hackathon and many teammates were new to development, so I made a point of using easy-to-pick-up prototyping tools like Figma MCP and Claude Design to keep the team on the same page.",
      },
      {
        ja: "また、ハッカソン参加回数が多かったこともあり、自然と私が PM のような役回りになったので、最初に「一番楽しいチームにしたい」という目標を共有して、メンバーが発言しやすいようにしました。そのうえでメンバーそれぞれの目標も聞き、方針や開発への向き合い方を決めていきました。",
        en: "Since I'd been to more hackathons than the others, I naturally ended up in a PM-like role. At the start I shared my goal, \"I want us to be the team having the most fun,\" so everyone would feel free to speak up. Then I asked about each member's goals and we decided our direction and how to approach the build.",
      },
      {
        ja: "最終的に優秀賞をいただいたうえ、メンバーから「初めてのハッカソンだったけど、一緒のチームになれたおかげで楽しかった」と言ってもらえて、やりがいを感じることができました！",
        en: "We won the Excellence Award, and a teammate told me, \"It was my first hackathon, but it was fun because I was on this team.\" That made it all feel worth it!",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Mercari AI Agent Hackathon", en: "Mercari AI Agent Hackathon" },
      teamSize: 3,
      start: "2026-08-31",
      end: "2026-09-01",
    },
    role: { ja: "PM・エンジニア", en: "PM / Engineer" },
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
      ja: "せーので、「おやすみなさい」── 友達と一緒に睡眠習慣をつくるSNS",
      en: "Ready, set, \"good night\" — a social app for building sleep habits together with friends",
    },
    summary: [
      {
        ja: "寝るきっかけがなく、睡眠習慣も1人だと続かない、という2つの課題から出発しました。",
        en: "We started from two problems: there's no trigger to go to bed, and sleep habits are hard to keep up alone.",
      },
      {
        ja: "ロック画面で友達が何人寝ているかがわかり、就寝目標を守れていないと友達の投稿が見られない仕組みで、みんなで寝る流れをつくります。",
        en: "Your lock screen shows how many friends are asleep, and if you miss your bedtime goal you can't see your friends' posts, so everyone gets pulled toward bed together.",
      },
      {
        ja: "星空の発光は Metal で描き、睡眠データは HealthKit から取得しています。インフラは Terraform で組み、AWS の費用は月450円に収めました。",
        en: "The glowing night sky is drawn with Metal, and sleep data comes from HealthKit. The infrastructure is built with Terraform, and we kept AWS costs to ¥450 a month.",
      },
    ],
    retro: [
      {
        ja: "インターンやハッカソンの経験が豊富で、領域ごとの専門性が高いメンバーに囲まれていたので、実装はある程度メンバーに任せ、チームのアウトプットを最大化するために自分にできることをやろうと決めました。特に力を入れたのは、アプリ全体のコンセプトを練り上げること、チーム内のコミュニケーションを円滑にすること、Discord サーバーを盛り上げること、そしてプレゼンの構成です。",
        en: "I was surrounded by teammates with plenty of internship and hackathon experience and deep expertise in their own areas, so I left much of the implementation to them and decided to do whatever I could to maximize the team's output. I focused especially on refining the app's overall concept, keeping communication within the team smooth, keeping our Discord server lively, and structuring the presentation.",
      },
      {
        ja: "2ヶ月にも及ぶハッカソンでしたが、チーム全員が満足できるクオリティのアプリを完成させられました。今でもメンバーで次のハッカソンに出たり旅行の計画を立てたりするほど仲の良いチームになれたことが、とても嬉しいです。",
        en: "It was a hackathon that stretched over two months, but we finished an app the whole team was happy with. I'm really glad we became close enough that we still enter hackathons and plan trips together.",
      },
      {
        ja: "完全に余談ですが、[About ページ](/about)のプロフィール写真は、このチームのメンバーと撮ったものです！",
        en: "A complete aside: the profile photo on [the About page](/about) was taken with this team!",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "THE HACK 2026（東京予選・大阪本戦）", en: "THE HACK 2026 (Tokyo Qualifier & Osaka Final)" },
      teamSize: 5,
      start: "2026-07-04",
      end: "2026-08-23",
    },
    role: { ja: "PM・バックエンド", en: "PM / Backend" },
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
      en: "BeReal × GitHub — a social app for developers to share the moment",
    },
    summary: [
      {
        ja: "リモートのチーム開発では、誰かが言い出すまで進捗共有が始まらず、返信も来ないことがよくあります。",
        en: "In remote team development, progress updates often don't happen until someone brings them up, and replies don't come either.",
      },
      {
        ja: "そこで BeReal の「通知が来たら今すぐ投稿」を持ち込み、ランダムな時間に全員へ通知を飛ばして、1時間以内にコミットや進捗を共有する仕組みにしました。",
        en: "So we borrowed BeReal's \"post right now when the notification arrives\": everyone gets a notification at a random time and shares their commits or progress within an hour.",
      },
    ],
    retro: [
      {
        ja: "私はバックエンドとインフラを担当し、Go のバックエンドを Cloudflare の Workers・D1・R2 の上で動かしています。",
        en: "I handled the backend and infrastructure, running the Go backend on Cloudflare Workers, D1, and R2.",
      },
      {
        ja: "特に、GitHub の commit を起点に通知を出すまでの流れは、アーキテクチャ全体を意識して実装する必要がありました。構想段階から実装まで、図に起こしたり AI と壁打ちしたりを続けて、なんとか技育博の展示までに作り切ることができました。",
        en: "The flow from a GitHub commit to sending a notification in particular required thinking about the whole architecture. I kept drawing diagrams and bouncing ideas off AI from the planning stage through implementation, and managed to finish it in time for the Geek Expo exhibit.",
      },
      {
        ja: "技育展は私の都合がつかなかったのですが、チームメンバーが頑張ってバトンをつないでくれました。開発チームの中に BeGit; を愛する空気があることを誇らしく思っています。",
        en: "I couldn't make it to the Gikuten contest, but my teammates worked hard and carried the baton. I'm proud that our team has such love for BeGit;.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "技育CAMP ハッカソン 2026 vol.3", en: "Geek Camp Hackathon 2026 vol.3" },
      teamSize: 4,
      start: "2026-05-18",
      end: null,
    },
    role: { ja: "バックエンド・インフラ", en: "Backend / Infrastructure" },
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
        event: { ja: "技育博 2026 vol.2", en: "Geek Expo 2026 vol.2" },
        prize: { ja: "サイバーエージェント賞", en: "CyberAgent Award" },
        rank: "sponsor",
        sponsor: { ja: "サイバーエージェント", en: "CyberAgent" },
        date: "2026-09",
        day: "19",
      },
      {
        event: { ja: "技育博 2026 vol.2", en: "Geek Expo 2026 vol.2" },
        prize: { ja: "ゆめみ賞", en: "YUMEMI Award" },
        rank: "sponsor",
        sponsor: { ja: "ゆめみ", en: "YUMEMI" },
        date: "2026-09",
        day: "19",
      },
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
      ja: "検索履歴から「好きになる前」の好奇心を可視化するステッカーブック",
      en: "A sticker book that visualizes the curiosity behind your search history, before it becomes a favorite",
    },
    summary: [
      {
        ja: "「今の SNS は好きなものを強めるのが中心で、まだ知らない熱中に出会う場が少ない」と感じたのが出発点です。",
        en: "It started from a feeling that \"today's social media mostly reinforces what you already like, and there are few places to stumble on a passion you don't know yet.\"",
      },
      {
        ja: "Chrome 拡張で閲覧履歴を集め、embedding と pgvector で関心ごとにまとめて、1つずつ「ステッカー」に起こします。",
        en: "A Chrome extension collects your browsing history, groups it by interest with embeddings and pgvector, and turns each group into a \"sticker.\"",
      },
    ],
    retro: [
      {
        ja: "ハッカソンのテーマは「これ面白くない？の偏愛をつなぐ」で、そこからチームでコンセプトを詰めるのにいちばん時間を使いました。",
        en: "The hackathon's theme was \"connect the 'isn't this interesting?' obsessions,\" and we spent most of our time working out the concept as a team from there.",
      },
      {
        ja: "ここまでユーザーニーズを深掘りしながら進めるハッカソンは初めてでした。メンターさんからのフィードバックも的を射たものが多く、刺激になったのを覚えています。",
        en: "It was my first hackathon that dug this deep into user needs. The mentors' feedback was often spot-on, and I remember it being really stimulating.",
      },
      {
        ja: "また、私たちのチームのPMは、事前に目標を、最終日には KPT をメンバー同士で共有し合う進め方を実践していました。ここから学べることが多く、以降のハッカソンやインターンシップで意識しているフレームワークの土台ができたハッカソンでした。",
        en: "Our PM also had us share goals at the start and a KPT retrospective on the last day. I learned a lot from that, and this hackathon laid the foundation for the frameworks I keep in mind at hackathons and internships since.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Engineer Guild Hackathon 2026", en: "Engineer Guild Hackathon 2026" },
      teamSize: 5,
      start: "2026-05-24",
      end: "2026-05-26",
    },
    role: { ja: "フロントエンド", en: "Frontend" },
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
      en: "A real-time battle game powered by Apple Watch sensor data",
    },
    summary: [
      {
        ja: "2026年2月末に『ジョジョの奇妙な冒険 ラストサバイバー』の全国大会があったので、リアルでもラッシュの速さ比べがしたいなと思って作りました。",
        en: "The national tournament for JoJo's Bizarre Adventure: Last Survivor was at the end of February 2026, and I wanted to have a real-life rush speed contest, so we made this.",
      },
      {
        ja: "Apple Watch の加速度でパンチを検知し、iOS アプリから WebTransport で Rust 製の同期サーバーに送って、Web 上でバトルを描きます。（第3部のラストシーンを再現！）",
        en: "The Apple Watch's accelerometer detects punches, the iOS app sends them over WebTransport to a sync server written in Rust, and the battle plays out on the web. (Recreating the final scene of Part 3!)",
      },
    ],
    retro: [
      {
        ja: "Watch との接続が安定せず、Core ML での動きの識別は諦めましたが、加速度だけに絞ったことで最後まで作り切れました！",
        en: "The connection to the Watch was unstable, so we gave up on recognizing motions with Core ML, but narrowing it down to acceleration alone let us see it through to the end!",
      },
      {
        ja: "[OFF](/works/off)から一緒に出ている同じメンバーで、58ハッカソンへの挑戦は[Imacalla](/works/imacalla)、[MokuHub](/works/mokuhub)に続いて3回目でした。このメンバーで最優秀賞を獲得したのは初めてで、とても思い出深い作品になっています。",
        en: "With the same team I've competed with since [OFF](/works/off), this was our third 58 Hackathon after [Imacalla](/works/imacalla) and [MokuHub](/works/mokuhub). It was the first time this team won the Grand Prize, which makes it a really memorable project.",
      },
      {
        ja: "ライブデモでは思いっきりパンチを繰り出し、キャラになりきってラッシュバトルをしました。当初思い描いていた瞬間をメンバーで実現できたことも感慨深かったです。",
        en: "In the live demo we threw punches with everything we had and fought rush battles fully in character. Making the moment we'd pictured from the start real as a team was moving too.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "第6回 58ハッカソン", en: "6th 58 Hackathon" },
      teamSize: 3,
      start: "2026-02-10",
      end: "2026-03-01",
    },
    role: { ja: "フロントエンド", en: "Frontend" },
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
      ja: "歩いて避難訓練を習慣にする、避難所バッジ集め",
      en: "Collect shelter badges and make walking evacuation drills a habit",
    },
    summary: [
      {
        ja: "避難訓練は、机の上で説明を読んで終わりになりがちです。",
        en: "Evacuation drills tend to end with reading instructions at a desk.",
      },
      {
        ja: "そこで毎日 AI が「いま何が起きたか」という災害シナリオを出し、それに合わせて近くの避難所まで実際に歩いて向かうアプリにしました。",
        en: "So every day an AI presents a disaster scenario of what just happened, and you actually walk to a nearby shelter in response.",
      },
      {
        ja: "たどり着くとバッジがたまっていくので、ゲーム感覚で続けられます。",
        en: "You collect badges as you reach shelters, so it keeps going like a game.",
      },
    ],
    retro: [
      {
        ja: "このハッカソンのチームメンバーは全員国籍が違い、ミーティングやドキュメントはすべて英語でした。テーマを「避難訓練」に決めたのも、全員が共通して課題を感じられるものだったからです。",
        en: "Everyone on this team was from a different country, and all our meetings and documents were in English. We chose evacuation drills as the theme because it was a problem everyone could relate to.",
      },
      {
        ja: "言語が違ってもチームでアプリ開発ができる、ということを実感した象徴的な経験になりました！",
        en: "It was a defining experience that showed me a team can build an app together even across languages!",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "JPHACKS 2025", en: "JPHACKS 2025" },
      teamSize: 5,
      start: "2025-10-03",
      end: "2025-11-09",
    },
    role: { ja: "PM・バックエンド", en: "PM / Backend" },
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
        event: { ja: "JPHACKS", en: "JPHACKS" },
        prize: {
          ja: "Award Day Finalist Award",
          en: "Award Day Finalist Award",
        },
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
      ja: "物流データが「風」に！  — 飛ばされた投稿をキャッチするSNS",
      en: "Logistics data becomes \"wind\"! — a social app where you catch posts blown your way",
    },
    summary: [
      {
        ja: "物流のオープンデータを使えば、物流そのものを体験できて面白いのでは、という発想から始まりました。",
        en: "It began with the idea that open logistics data could let you experience logistics itself, and that it might be fun.",
      },
      {
        ja: "国交省の自動車輸送統計から「風」のベクトルを作り、投稿した絵葉書が紙飛行機のようにその風に乗って、誰かの元に届きます。",
        en: "We build \"wind\" vectors from the MLIT's road freight statistics, and the postcards you post ride that wind like paper airplanes until they reach someone.",
      },
    ],
    retro: [
      {
        ja: "個人的には、初めて AWS と Terraform に挑戦し、ECS を使ったデプロイを経験できました。",
        en: "Personally, it was my first time trying AWS and Terraform, and I got to deploy with ECS.",
      },
      {
        ja: "チームは、事前に一緒に組んだ1人と、即席で組んだメンバー2人との4人で、分担が難しかったのを覚えています。それまで即席チームでは「教えてもらう立場」で参加することが多かったのですが、ハッカソンの参加回数も増え、いつまでも初心者とは言っていられない状況でした。",
        en: "Our team of four was one person I'd teamed up with in advance plus two members matched on the spot, and I remember finding it hard to split the work. Until then I'd usually joined ad-hoc teams as the one being taught, but with more hackathons behind me, I couldn't keep calling myself a beginner.",
      },
      {
        ja: "この経験から、チーム開発では明確な方針を示してメンバーにタスクを振るマネージャー役がいたほうが、負担が偏らず、やりがいを感じやすいのではないか？と考えるようになりました。",
        en: "This experience got me thinking that in team development, having a manager who sets a clear direction and hands out tasks might keep the load from falling unevenly and make the work feel more rewarding.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Progate ハッカソン powered by ProjectLINKS & AWS", en: "Progate Hackathon powered by ProjectLINKS & AWS" },
      teamSize: 4,
      start: "2025-09-03",
      end: "2025-09-14",
    },
    role: { ja: "バックエンド・インフラ", en: "Backend / Infrastructure" },
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
      ja: "GitHub × TETRIS  — 日々の『積み上げ』を『積み上げ』て高得点を狙おう！",
      en: "GitHub × TETRIS — stack up your daily stacking for a high score!",
    },
    summary: [
      {
        ja: "テトリスの盤面って GitHub の草に似ている！",
        en: "A Tetris board looks like a GitHub contribution graph!",
      },
      {
        ja: ".......という思いつきから、日々の積み上げ（Contribution）を切り出して、テトリミノとして積むゲームにしました！",
        en: "That passing thought turned into a game where your daily contributions are cut out and stacked as tetrominoes!",
      },
      {
        ja: "「『積み上げ』を『積み上げ』ろ」という言葉どおり、Contribution が多い日のブロックほど消したときに高得点になるので、エンジニアが圧倒的に有利な対戦ができます。",
        en: "True to \"stack up your stacking,\" blocks from days with more contributions score higher when cleared, so engineers have an overwhelming advantage in battles.",
      },
    ],
    retro: [
      {
        ja: "私はバックエンドを担当し、Go と WebSocket で対戦サーバーを作りました。",
        en: "I handled the backend and built the battle server with Go and WebSocket.",
      },
      {
        ja: "開発のマイルストーンから issue を自動で切る GitHub Actions も作り、Webhook で Discord サーバーとつないで確認しながら進めたことで、少人数でも計画的に開発を進めることができました。",
        en: "I also built a GitHub Actions workflow that automatically opens issues from our milestones, and connected it to our Discord server with a webhook so we could keep track as we went. That let even our small team develop on schedule.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Progate Women's ハッカソン", en: "Progate Women's Hackathon" },
      teamSize: 3,
      start: "2025-06-11",
      end: "2025-06-22",
    },
    role: { ja: "バックエンド", en: "Backend" },
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
      ja: "エンジニアたちが「もくもく作業」を共有し、応援し合えるDiscord Activity",
      en: "A Discord Activity where engineers share their heads-down work sessions and cheer each other on",
    },
    summary: [
      {
        ja: "自分の作業記録を見えるようにするツールはあっても、コミュニティの中でお互いの頑張りを見合えるものは少ないと感じていました。",
        en: "There are tools to make your own work log visible, but I felt there were few that let people in a community see and appreciate each other's effort.",
      },
      {
        ja: "そこで Discord Activity でコミットをリアルタイムに共有し、アプリで記録を残せるようにしました。",
        en: "So we share commits in real time through a Discord Activity and keep a record in the app.",
      },
      {
        ja: "API サーバーを作らずに済むよう、Discord の制限をプロキシ経由の認証で回避し、維持費0円で動く構成にしています。",
        en: "To avoid running an API server, we worked around Discord's restrictions with authentication through a proxy, so it runs at zero maintenance cost.",
      },
    ],
    retro: [
      {
        ja: "私は主に Discord Activity の実装を担当し、情報量が少なく操作しやすい UI にすることを心がけました。",
        en: "I mainly implemented the Discord Activity, aiming for a UI that shows little information and is easy to use.",
      },
      {
        ja: "このメンバーで開発するのは[OFF](/works/off)、[Imacalla](/works/imacalla)に続いて3回目です。それまでは仕事をもらって補助的に実装することが多かったのですが、このハッカソンで初めて、自分の担当（フロントエンド）をはっきり持てたと記憶しています。",
        en: "This was my third project with this team, after [OFF](/works/off) and [Imacalla](/works/imacalla). Before that I mostly took tasks from others and helped with implementation, but I remember this hackathon being the first time I clearly owned a part (the frontend).",
      },
      {
        ja: "一方で、Git の管理を AI に任せきりにしていたところ、force push したコードを勝手に merge され、大事件を引き起こしてしまいました。AI の出力に責任を持つ意識が欠けていたと気づかされ、良い教訓になりました。",
        en: "On the other hand, I'd left Git management entirely to AI, and it merged force-pushed code on its own, causing a major incident. It made me realize I lacked a sense of responsibility for AI output, and it was a good lesson.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "第3回 58ハッカソン", en: "3rd 58 Hackathon" },
      teamSize: 3,
      start: "2025-05-07",
      end: "2025-05-18",
    },
    role: { ja: "フロントエンド", en: "Frontend" },
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
      ja: "『 このPr○gate、なんか変・・・？ 』 — コーディング中に起こる異変を見つけよう！",
      en: "\"Something's off about this Pr○gate...?\" — spot the anomalies that happen while you code!",
    },
    summary: [
      {
        ja: "『8番出口』の「異変を見つけたら引き返す」仕組みを、Progate 風のプログラミング学習画面に持ち込みました。",
        en: "We brought the \"turn back when you spot an anomaly\" mechanic from The Exit 8 into a Progate-style programming lesson screen.",
      },
      {
        ja: "書いたコードは WebContainer のサンドボックスの中で実行するので、ブラウザ上でも安全に動かせます。ゲームとしての面白さだけでなく、ちゃんと学べる問題にすることにも力を入れました。",
        en: "Code you write runs inside a WebContainer sandbox, so it's safe to run in the browser. Beyond making it fun as a game, we also worked to make the problems genuinely educational.",
      },
    ],
    retro: [
      {
        ja: "この回で初めてデプロイに挑戦しました。Vercel のアカウント作成からデプロイまで2時間ほどかかりましたが、なんとかハッカソンの期間内にやり切ることができました。",
        en: "This was my first time deploying. It took about two hours from creating a Vercel account to deploying, but I managed to get it done within the hackathon.",
      },
      {
        ja: "正直、今思えば「なんであんなに時間がかかっていたのだろう・・・」と思わなくもないのですが、それまで「デプロイ」という言葉に身構えていた私にとって、このハッカソンはデプロイへの心理的なハードルがなくなるきっかけになったと感じています。",
        en: "Honestly, looking back I do wonder why it took so long... but for me, someone who used to tense up at the word \"deploy,\" this hackathon was what took away that mental hurdle.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Progate ハッカソン 〜オンライン〜 2025.4", en: "Progate Hackathon Online 2025.4" },
      teamSize: 5,
      start: "2025-04-15",
      end: "2025-04-28",
    },
    role: { ja: "フロントエンド", en: "Frontend" },
    stack: ["typescript", "react", "supabase"],
    links: {
      repo: "https://github.com/2504-progate-hanami/exit-prog8",
      demo: "https://exit-prog8-vercel.vercel.app",
      article: "https://topaz.dev/projects/ccc1446d70a00e93ff2d",
    },
    image: {
      src: "/works/exit-prog8.webp",
      width: 1200,
      height: 675,
      alt: {
        ja: "Prog-8版出口 のキャラクターのイラスト",
        en: "Illustration of the Exit Prog-8 character",
      },
    },
  },

  lunchjam: {
    title: { ja: "LunchJAM", en: "LunchJAM" },
    tagline: {
      ja: "『 食堂混みすぎ！ 』 — QRコードで入退室を記録し、食堂の混雑を緩和",
      en: "\"The cafeteria is way too crowded!\" — easing cafeteria crowding by logging entries and exits with QR codes",
    },
    summary: [
      {
        ja: "学食がいつ行っても混みすぎている、という身近な不満から作りました。",
        en: "We built it out of an everyday complaint: the campus cafeteria is packed whenever you go.",
      },
      {
        ja: "入口と出口で QR コードを読み取って在室人数を数えるので、行く前にいまどれくらい混んでいるかを確かめられます。",
        en: "QR codes scanned at the entrance and exit count how many people are inside, so you can check how crowded it is before you go.",
      },
    ],
    retro: [
      {
        ja: "私はバックエンド開発を担当し、FastAPI で構築したサーバーを Docker コンテナ上に載せました。Docker もバックエンドも担当するのは初めてでしたが、この回を通して勉強する機会になったと思っています。",
        en: "I handled backend development and ran a server built with FastAPI in a Docker container. It was my first time with both Docker and the backend, and I think this hackathon gave me a chance to learn them.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Waffle College ミニハッカソン", en: "Waffle College Mini Hackathon" },
      teamSize: 3,
      start: "2025-02-14",
      end: "2025-02-21",
    },
    role: { ja: "バックエンド", en: "Backend" },
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
      en: "A calling app by the bored, for the bored",
    },
    summary: [
      {
        ja: "誰かと通話したいときに「いまかけていいのかな」と迷う気まずさを、ステータス表示でなくしたいと考えました。アプリ名の「Imacalla」は、「今から」と「I'm a caller」のダブルミーニングになっています。",
        en: "I wanted a status display to get rid of that awkward \"is it okay to call right now?\" hesitation when you want to talk to someone. The name Imacalla is a double meaning of the Japanese \"imakara\" (\"from now\") and \"I'm a caller.\"",
      },
      {
        ja: "アプリを起動するとすぐにオンライン中のフレンド一覧が表示されるので、暇な人どうしで気軽に電話できます。Hono の RPC でフロントとサーバーの型をそろえ、通話は LiveKit で組みました。",
        en: "Open the app and you immediately see which friends are online, so bored people can call each other casually. We kept the frontend and server types in sync with Hono RPC and built calling on LiveKit.",
      },
    ],
    retro: [
      {
        ja: "私は React Native を使ったクライアント実装を担当し、この回で初めて React を勉強しました。後からデータを渡しやすい構造を意識してコンポーネントを実装し、チームメンバーから褒めてもらえたことがとても嬉しかったと記憶しています。",
        en: "I implemented the client with React Native and learned React for the first time at this hackathon. I built components with a structure that made it easy to pass data in later, and I remember being really happy when teammates praised it.",
      },
      {
        ja: "一方で、肝心の通話機能がハッカソン中のデモで動かないという事態が発生してしまい、苦い思い出も残るハッカソンでした。",
        en: "On the other hand, the core calling feature didn't work during the hackathon demo, which left a bitter memory too.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "58ハッカソン2025 feat.関西学生エンジニア", en: "58 Hackathon 2025 feat. Kansai Student Engineers" },
      teamSize: 3,
      start: "2025-02-04",
      end: "2025-02-16",
    },
    role: { ja: "フロントエンド", en: "Frontend" },
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
    title: { ja: "ごめんなさい.com", en: "Sorry.com" },
    tagline: {
      ja: "謝罪文の添削・投稿・保存により、『まったく新しい謝罪体験』を提供するサービス",
      en: "A service offering an \"all-new apology experience\" by reviewing, posting, and saving apology letters",
    },
    summary: [
      {
        ja: "「大学に入ってから謝罪文を書く機会が増えたのに、書き方に困る学生が多い」と感じたのが開発のきっかけです。",
        en: "It started from a feeling that \"since entering university we write apology letters more often, yet many students don't know how to write them.\"",
      },
      {
        ja: "このサイトでは、謝罪文を投稿してユーザーどうしで「ドンマイ！」と励まし合ったり、投稿された謝罪文をテンプレートにし合ったりできます。",
        en: "On this site you can post apology letters, cheer each other on with \"Don't worry about it!\", and turn posted letters into templates for each other.",
      },
      {
        ja: "謝罪文を作成するときやテンプレートを利用するときには、AI がユーザーの状況や謝る相手との間柄、文章のカジュアルさに合わせて本文を添削してくれます。これにより、テンプレートの使い回しにならない謝罪文が書けます。",
        en: "When you write a letter or use a template, AI reviews the text to fit your situation, your relationship with the person you're apologizing to, and how casual it should be. That way you get an apology that isn't just a recycled template.",
      },
    ],
    retro: [
      {
        ja: "私は原案を出し、デザイン、全体のデバッグ、PM などを担当しました。はじめてのハッカソン（[OFF](/works/off)）で経験した役割分担を意識し、進捗管理のスプレッドシートを独自に作ったり、全体のやる気を保つための声かけや作業会を主導したりして、メンバーが楽しく開発を進められるようにしました。",
        en: "I came up with the original idea and handled design, overall debugging, and PM, among other things. Keeping in mind the division of roles I experienced at my first hackathon ([OFF](/works/off)), I made my own progress-tracking spreadsheet, led pep talks and work sessions to keep everyone motivated, and made sure the team enjoyed building.",
      },
      {
        ja: "結果的にハッカソン人生で初めての最優秀賞をいただき、たくさんのやりがいと楽しさ、そして達成感を味わえたハッカソンになりました。",
        en: "In the end we won the first Grand Prize of my hackathon life, and it became a hackathon full of reward, fun, and a sense of accomplishment.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Waffle College 卒業ハッカソン", en: "Waffle College Graduation Hackathon" },
      teamSize: 5,
      start: "2024-12-13",
      end: "2025-01-18",
    },
    role: { ja: "PM・盛り上げ係", en: "PM / Team cheerleader" },
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
        en: "Screenshot of Sorry.com",
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
      en: "A mobile app that shows you where the bargain sales are!",
    },
    summary: [
      {
        ja: "バーゲンセールの情報は、たまたま通りかかった人や詳しい人にしか届きません。そこでスクレイピングではなくユーザーが投稿する形にして、地域による情報の差を減らそうと考えました。",
        en: "Information about bargain sales only reaches people who happen to walk by or who are in the know. So instead of scraping, we made it user-posted, hoping to narrow the information gap between regions.",
      },
      {
        ja: "アプリは React Native（Expo）、バックエンドは FastAPI と DynamoDB で作り、EKS 上に ArgoCD で自動デプロイしている・・・らしい、です。（後述）",
        en: "The app is built with React Native (Expo), the backend with FastAPI and DynamoDB, and it's auto-deployed to EKS with ArgoCD... or so I'm told. (More on that below.)",
      },
    ],
    retro: [
      {
        ja: "OFF は、私にとって初めてのハッカソンで、初めての開発経験でした。正直、この開発期間の私は、commit コマンドを練習したり、フロントエンド・API・flutter・ArgoCD などの言葉を調べたりすることで精一杯でした。",
        en: "OFF was my first hackathon and my first development experience. Honestly, during this hackathon I was doing all I could just to practice the commit command and look up words like frontend, API, Flutter, and ArgoCD.",
      },
      {
        ja: "チームには開発のベテランのメンバーがいて、上に書いた技術選定から実装までを担っていたのは、ほとんどその人たちです。このハッカソンで彼らとチームメンバーとして出会い、専門用語や開発の進め方を教えてもらえたことが、今の私につながっていると思っています。",
        en: "The team had veteran developers, and they were the ones who did almost everything above, from choosing the tech stack to implementing it. Meeting them as teammates at this hackathon and having them teach me the jargon and how development works is what led to who I am today.",
      },
      {
        ja: "チームメンバーには、感謝してもしきれない気持ちです。",
        en: "I can't thank my teammates enough.",
      },
    ],
    category: "hackathon",
    hackathon: {
      event: { ja: "Progateハッカソン powered by AWS", en: "Progate Hackathon powered by AWS" },
      teamSize: 5,
      start: "2024-11-27",
      end: "2024-12-07",
    },
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

/**
 * トップの Featured works に並べる作品と、その順。
 * featured フラグとは別に手で選ぶ。フラグでは並びを持てないので、
 * 順まで決めたいここでは slug の配列で持つ。
 * 2 列 x 2 段で穴が出ないよう 4 件に保つ。
 */
export const HOME_WORKS = [
  "lsib",
  "nemmy",
  "begit",
  "tsuki-no-hayasa",
] as const satisfies readonly WorkSlug[];
