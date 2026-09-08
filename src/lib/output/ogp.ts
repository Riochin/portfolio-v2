import { fetchHeadMeta } from "@/lib/meta-tags";
import { REVALIDATE_SECONDS } from "./config";
import { allowImageUrl } from "./images";

/**
 * ページの HTML から og:image を拾う。
 * フィードがサムネイルを持たないソース (Qiita) 用のフォールバック。
 * 取れなくても一覧は出したいので、失敗は undefined に潰す。
 *
 * head の取得と meta の走査そのものは lib/meta-tags.ts が持つ (本文の
 * リンクカードと共有)。ここに残すのは /output 固有の方針の 2 つだけ:
 * 許可ホスト以外は捨てること (next/image の remotePatterns と揃える) と、
 * 一覧が ISR なので revalidate に乗せること。
 */
export async function fetchOgImage(url: string): Promise<string | undefined> {
  const head = await fetchHeadMeta(
    url,
    { revalidate: REVALIDATE_SECONDS },
    "output",
  );
  if (!head) return undefined;

  // og:image を優先し、無い (か許可ホスト外の) ときだけ twitter:image に落ちる。
  return (
    allowImageUrl(head.meta.get("og:image")) ??
    allowImageUrl(head.meta.get("twitter:image"))
  );
}
