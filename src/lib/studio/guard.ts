import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { verifyAccess } from "./access";
import { hasGitHubStore } from "./store";

/**
 * studio を開いてよいか。
 *
 * - dev: 誰でも。保存先は作業ツリー (fs-store)
 * - 本番: Cloudflare Access の JWT が検証でき、GitHub の設定が揃っているときだけ。
 *   どちらかが欠けていれば素の 404 ── 道具があることすら見せない
 *
 * 本番でも Access の JWT だけでは足りず GitHub の設定を要るのは、
 * Vercel のファイルシステムに書けない以上、開けても保存できないため。
 */
export async function studioAllowed(requestHeaders: Headers): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  if (!hasGitHubStore()) return false;
  const result = await verifyAccess(requestHeaders);
  return result.ok;
}

/** ページ用。通らなければ notFound() で抜ける。 */
export async function requireStudioPage(): Promise<void> {
  if (!(await studioAllowed(await headers()))) notFound();
}

/** Route Handler 用。通らなければ 404 の Response を返す (通れば undefined)。 */
export async function denyStudioRoute(
  request: Request,
): Promise<Response | undefined> {
  if (await studioAllowed(request.headers)) return undefined;
  return new Response(null, { status: 404 });
}
