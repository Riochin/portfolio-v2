import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Cloudflare Access の検証。
 *
 * 本番の studio は `studio.riochin.dev` だけを Cloudflare の proxy に乗せ、
 * その前に Access (メールのワンタイムコード、著者のアドレスのみ許可) を置く。
 * Access を通った要求には Cloudflare が `Cf-Access-Jwt-Assertion` ヘッダ
 * (と `CF_Authorization` cookie) を付けるので、アプリ側でもその JWT を
 * 署名・発行元・audience・期限の 4 点で確かめる。
 *
 * 確かめ直すのは、Access を経由しない道があるため。riochin.dev 本体は
 * Vercel に直結していて Cloudflare を通らないので、`riochin.dev/studio` に
 * 来た要求にはこのヘッダが無い (あっても偽物で、署名が合わない)。
 *
 * 環境変数が無ければ無条件に不合格にする (フェイルクローズ)。
 * 設定の取り方は .env.example に書いてある。
 */

const TEAM_DOMAIN = process.env.CF_ACCESS_TEAM_DOMAIN;
const AUD = process.env.CF_ACCESS_AUD;
/** 省略可。入っていれば Access のポリシーに加えてメールも照合する。 */
const EMAIL = process.env.CF_ACCESS_EMAIL;

const HEADER = "cf-access-jwt-assertion";
const COOKIE = "CF_Authorization";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function readToken(headers: Headers): string | undefined {
  const fromHeader = headers.get(HEADER);
  if (fromHeader) return fromHeader;

  // <img> などのサブリソースにはヘッダが付かないことがあるので cookie も見る。
  const cookie = headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return undefined;
}

export type AccessResult =
  | { readonly ok: true; readonly email: string | undefined }
  | { readonly ok: false; readonly reason: string };

export async function verifyAccess(headers: Headers): Promise<AccessResult> {
  if (!TEAM_DOMAIN || !AUD) {
    return { ok: false, reason: "CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD が無い" };
  }

  const token = readToken(headers);
  if (!token) return { ok: false, reason: "Access の JWT が無い" };

  const issuer = `https://${TEAM_DOMAIN}`;
  jwks ??= createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: AUD });
    const email = typeof payload.email === "string" ? payload.email : undefined;
    if (EMAIL && email !== EMAIL) {
      return { ok: false, reason: `メールが一致しない (${email ?? "無し"})` };
    }
    return { ok: true, email };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "JWT を検証できない",
    };
  }
}
