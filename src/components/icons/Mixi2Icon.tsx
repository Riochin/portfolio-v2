/**
 * mixi2 のシンボル。他のブランドと違い単色ではなくグラデーションなので、
 * ホバー時のブランド色を site.ts が `url(#mixi2-brand)` で指せるよう defs を持たせる。
 * サイドバーとモバイルメニューで 2 回描かれ id が重複するが、
 * 中身が同一なのでどちらを参照しても見た目は変わらない。
 */
export function Mixi2Icon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="mixi2-brand"
          x1="5.95987"
          y1="6.31969"
          x2="20.0358"
          y2="17.8845"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF79A1" />
          <stop offset="1" stopColor="#FF9A00" />
        </linearGradient>
      </defs>
      <path d="M21.9095 7.86321C19.8945 0.385213 14.0676 12.0545 11.7254 5.55945C10.1128 1.08863 3.47949 6.2214 1.873 12.4492C0.9515 16.02 2.74843 18.31 7.45577 15.2644C11.2017 12.8409 13.5085 13.4598 13.1077 17.7847C12.9295 19.7076 15.1534 21.182 18.417 19.1301C22.1123 16.8079 23.0138 11.9716 21.908 7.86474L21.9095 7.86321Z" />
    </svg>
  );
}
