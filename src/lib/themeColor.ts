/**
 * ブラウザの UI (Android の URL バー、アプリ内ブラウザの透明なツールバー、
 * スタンドアロン時のステータスバー) に渡す色。globals.css の --background と同じ値。
 *
 * layout.tsx の viewport が端末の明暗に合わせた 2 本の <meta> を出し、
 * サイト内のトグルで選び直したときは syncThemeColor が両方を書き換える。
 */
export const THEME_COLORS = {
  light: "#fbf3f5",
  dark: "#070d1e",
} as const;

/**
 * <meta name="theme-color"> を、いま選ばれているテーマの色にそろえる。
 *
 * 2 本の <meta> は media で端末の明暗に振り分けてあるので、トグルで端末と
 * 逆を選ぶと、ツールバーだけ端末側の色で残る。X やインスタのアプリ内
 * ブラウザでは透明なツールバーの下がこの色で塗られ、そこだけ元のテーマの
 * まま切り替わって見えていた。media は残したまま、content を両方とも
 * 同じ色にする (どちらが当たっても同じになる)。
 */
export function syncThemeColor(theme: keyof typeof THEME_COLORS) {
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    meta.content = THEME_COLORS[theme];
  }
}
