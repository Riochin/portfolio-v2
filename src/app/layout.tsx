import type { Metadata } from "next";
import { Zen_Maru_Gothic, Alex_Brush } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://riochin.dev"),
  title: {
    default: "Riochin",
    template: "%s | Riochin",
  },
  description: "Riochin のポートフォリオサイト",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${zenMaruGothic.variable} ${logoCursive.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SiteChrome />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
