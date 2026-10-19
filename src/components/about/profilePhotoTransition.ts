/**
 * プロフィール写真の view transition の名前。トップの小さな丸と /about の
 * 写真 (と、その拡大) を結ぶ。写真は 1 枚きりなので名前も固定。
 *
 * ProfilePhoto ではなくここに置いてあるのは、ProfilePhoto が "use client" だから。
 * クライアントモジュールの export は Server Component 側ではクライアント参照に
 * 差し替わるので、トップ (Server Component) から読むと中身の文字列が取れない
 * (workImageTransition.ts と同じ理由)。
 */
export const PROFILE_PHOTO_TRANSITION_NAME = "profile-photo";
