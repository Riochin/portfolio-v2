/**
 * 取得する集計期間。
 *
 * 片方だけだと偏る ── short_term(4 週間) はその時期たまたま繰り返し聴いた
 * ものに、long_term(全期間) は長く聴いてきた同じアーティストに寄る。
 * 混ぜると「今」と「ずっと」が並んで、どちらの偏りも目立たなくなる。
 *
 * この並び順は取得の順序でしかない。表示は最終的にアーティスト名順へ
 * 並べ替えられるので、どの曲がどの期間から来たかは画面には出ない。
 */
export const TIME_RANGES = ["short_term", "long_term"] as const;

/**
 * 抽選の母集団。各期間の上位何曲までを候補にするか。
 * 上位 3 曲をそのまま出すと毎回同じ顔ぶれになるので、ここから無作為に選ぶ。
 */
export const POOL_SIZE = 10;

/** 各期間から出す曲数。3 列グリッドのちょうど 1 段ぶん。 */
export const PER_RANGE = 3;

/**
 * `/me/top/tracks` を読むのに必要なスコープ。
 * refresh token を取り直すときにここを見れば分かるように残しておく。
 */
export const REQUIRED_SCOPE = "user-top-read";
