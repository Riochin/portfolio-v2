import type { Metadata } from "next";
import { Zen_Maru_Gothic, Alex_Brush } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SITE } from "@/data/site";
import { LOCALES, OG_LOCALE } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { alternates } from "@/lib/i18n/paths";
import "../globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru-gothic",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const logoCursive = Alex_Brush({
  variable: "--font-logo-cursive",
  weight: "400",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: SITE.brand,
      template: `%s | ${SITE.brand}`,
    },
    description: t(SITE.description),
    alternates: alternates(locale, "/"),
    openGraph: {
      type: "website",
      siteName: SITE.brand,
      locale: OG_LOCALE[locale],
      title: SITE.brand,
      description: t(SITE.description),
      url: alternates(locale, "/").canonical,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale } = await getT();

  return (
    <html
      lang={locale}
      className={`${zenMaruGothic.variable} ${logoCursive.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col text-base">
        <ThemeProvider>
          <SiteChrome />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
