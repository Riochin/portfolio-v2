import { serializeJsonLd, type JsonLd } from "@/lib/json-ld";

/**
 * 構造化データを埋める <script>。next/script ではなく素の script にするのは、
 * 中身が実行するコードではなくデータだから (Next の JSON-LD ガイド)。
 */
export function JsonLdScript({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
