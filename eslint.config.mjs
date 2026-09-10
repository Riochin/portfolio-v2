import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // eslint-config-next が積んでいる jsx-a11y は 34 ルールのうち 6 つだけ (alt-text,
  // aria-props, aria-proptypes, aria-unsupported-elements, role-has-required-aria-props,
  // role-supports-aria-props)、しかも警告どまり。残りも error で有効にする。
  //
  // ここで rules だけを流し込んでいるのは、jsx-a11y プラグイン本体の登録を
  // eslint-config-next が既に済ませているため。flatConfigs.recommended を丸ごと
  // spread すると `Cannot redefine plugin "jsx-a11y"` で ESLint が起動しない。
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,

      // recommended の alt-text は素の "error" で、eslint-config-next が付けている
      // `img: ["Image"]` — next/image の <Image> も検査対象に含める設定 — を潰してしまう。
      // 対象要素を明示し直して、そのマッピングだけ拾い直す。
      "jsx-a11y/alt-text": [
        "error",
        {
          elements: ["img", "object", "area", 'input[type="image"]'],
          img: ["Image"],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // dev を止めずに確認ビルドを出す先 (.gitignore にも入れてある)。
    ".next-verify/**",
  ]),
]);

export default eslintConfig;
