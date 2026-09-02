export type SkillCategory =
  "language" | "framework" | "infra" | "service" | "concept";

export type SkillDef = {
  /** ブランド名。日英で変わらないので Localized にしない。 */
  readonly label: string;
  readonly category: SkillCategory;
  /** About の Skills グリッドに出すもの。 */
  readonly featured?: boolean;
  /** simple-icons のスラッグ。アイコンを持たない技術は undefined。 */
  readonly icon?: string;
};

/**
 * 技術のマスタ登録簿。
 *
 * works.stack / experience.stack はこのキーの union しか受け付けないので、
 * 'React' と 'react' のような表記ゆれが型エラーになる
 * (旧サイトは technologies が自由文字列だったため静かに通っていた)。
 *
 * as const satisfies を使うのは、ランタイムコードがゼロで、
 * かつ keyof typeof でリテラル union が保てるため。
 */
export const SKILLS = {
  // 言語
  typescript: {
    label: "TypeScript",
    category: "language",
    featured: true,
    icon: "typescript",
  },
  javascript: {
    label: "JavaScript",
    category: "language",
    icon: "javascript",
  },
  python: {
    label: "Python",
    category: "language",
    featured: true,
    icon: "python",
  },
  // simple-icons は商標の都合で Java のアイコンを配っていないので OpenJDK で代用する
  csharp: { label: "C#", category: "language" },
  java: {
    label: "Java",
    category: "language",
    featured: true,
    icon: "openjdk",
  },
  kotlin: { label: "Kotlin", category: "language", icon: "kotlin" },
  go: { label: "Go", category: "language", featured: true, icon: "go" },
  rust: { label: "Rust", category: "language", icon: "rust" },
  swift: { label: "Swift", category: "language", icon: "swift" },
  html: { label: "HTML", category: "language", icon: "html5" },
  css: { label: "CSS", category: "language", icon: "css" },

  // フレームワーク・ライブラリ
  react: {
    label: "React",
    category: "framework",
    featured: true,
    icon: "react",
  },
  nextjs: {
    label: "Next.js",
    category: "framework",
    featured: true,
    icon: "nextdotjs",
  },
  swiftui: { label: "SwiftUI", category: "framework", icon: "swift" },
  fastapi: {
    label: "FastAPI",
    category: "framework",
    featured: true,
    icon: "fastapi",
  },
  flask: { label: "Flask", category: "framework", icon: "flask" },
  flutter: { label: "Flutter", category: "framework", icon: "flutter" },
  unity: { label: "Unity", category: "framework", icon: "unity" },
  hono: { label: "Hono", category: "framework", icon: "hono" },
  tailwindcss: {
    label: "Tailwind CSS",
    category: "framework",
    icon: "tailwindcss",
  },
  "framer-motion": {
    label: "Framer Motion",
    category: "framework",
    icon: "framer",
  },
  threejs: { label: "Three.js", category: "framework", icon: "threedotjs" },
  drizzle: { label: "Drizzle ORM", category: "framework", icon: "drizzle" },

  // インフラ
  docker: {
    label: "Docker",
    category: "infra",
    featured: true,
    icon: "docker",
  },
  kubernetes: {
    label: "Kubernetes",
    category: "infra",
    featured: true,
    icon: "kubernetes",
  },
  terraform: {
    label: "Terraform",
    category: "infra",
    featured: true,
    icon: "terraform",
  },
  // AWS 系は商標の都合で simple-icons から削除済みなので icon を持たない
  aws: { label: "AWS", category: "infra", featured: true },
  gcp: { label: "GCP", category: "infra", icon: "googlecloud" },
  ecr: { label: "Amazon ECR", category: "infra" },
  agones: { label: "Agones", category: "infra" },

  // サービス・データストア
  supabase: {
    label: "Supabase",
    category: "service",
    featured: true,
    icon: "supabase",
  },
  firebase: { label: "Firebase", category: "service", icon: "firebase" },
  postgresql: {
    label: "PostgreSQL",
    category: "service",
    icon: "postgresql",
  },
  mysql: { label: "MySQL", category: "service", icon: "mysql" },
  dynamodb: { label: "DynamoDB", category: "service" },
  pgvector: { label: "pgvector", category: "service" },
  discord: { label: "Discord", category: "service", icon: "discord" },
  figma: { label: "Figma", category: "service", icon: "figma" },
  "gemini-api": {
    label: "Gemini API",
    category: "service",
    icon: "googlegemini",
  },
  "github-oauth": {
    label: "GitHub OAuth",
    category: "service",
    icon: "github",
  },
  "google-maps": {
    label: "Google Maps API",
    category: "service",
    icon: "googlemaps",
  },
  turso: { label: "Turso", category: "service", icon: "turso" },
  // simple-icons は Auth.js のアイコンを配っていない
  authjs: { label: "Auth.js", category: "service" },
  sentry: { label: "Sentry", category: "service", icon: "sentry" },

  // 概念・プラットフォーム
  websocket: { label: "WebSocket", category: "concept" },
  "chrome-extension": {
    label: "Chrome Extension",
    category: "concept",
    icon: "googlechrome",
  },
} as const satisfies Record<string, SkillDef>;

export type SkillSlug = keyof typeof SKILLS;

export type Skill = SkillDef & { readonly slug: SkillSlug };
