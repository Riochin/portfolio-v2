export type TopTrack = {
  readonly id: string;
  readonly title: string;
  /** 複数アーティストは表示用に連結済み。描画側で配列を組み立てさせない。 */
  readonly artists: string;
  readonly album: string;
  /** Spotify の曲ページ。 */
  readonly url: string;
  /**
   * ジャケット画像。許可ホストから外れたものは undefined に落ちる。
   * OutputGrid と同じく、画像が無くてもタイルは出す。
   */
  readonly artwork?: string;
};
