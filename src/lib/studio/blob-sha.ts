import { createHash } from "node:crypto";

/**
 * git の blob SHA-1。GitHub の Contents API が返す `sha` と同じ値になる。
 *
 * ローカル (FS) の保存層もこれを返すことで、「開いたときの sha と保存時の sha を
 * 比べて競合を見つける」というエディタ側の約束を、保存先に関わらず 1 つにできる。
 */
export function gitBlobSha(bytes: Uint8Array): string {
  return createHash("sha1")
    .update(`blob ${bytes.byteLength}\0`)
    .update(bytes)
    .digest("hex");
}
