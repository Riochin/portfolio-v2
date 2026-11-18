import type { Metadata } from "next";
import { VtDiagnostics } from "./VtDiagnostics";

// View Transitions がアプリ内ブラウザ (X の WKWebView など) で効かない件の
// 診断用ページ。スマホにはコンソールが無いので、判定と実行結果を画面に出す。
// 本番の URL を X に貼って開き、Safari と見比べるために本番でも出す。
export const metadata: Metadata = {
  title: "VT debug",
  robots: { index: false, follow: false },
};

export default function DebugVtPage() {
  return <VtDiagnostics />;
}
