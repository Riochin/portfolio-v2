import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { SocialLinks } from "@/components/layout/SocialLinks";

export const metadata: Metadata = {
  title: "About me",
};

export default function AboutPage() {
  return (
    <PageShell>
      <div className="space-y-6 leading-relaxed">
        <p>
          こんにちは、Riochin です。ここに自己紹介文が入ります。実コンテンツは後で差し替えてください。
        </p>
        <SocialLinks direction="row" />
      </div>
    </PageShell>
  );
}
