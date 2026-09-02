import { SITE } from "@/data/site";

export function Copyright() {
  const year = new Date().getFullYear();
  const range =
    year > SITE.copyrightStartYear
      ? `${SITE.copyrightStartYear}–${year}`
      : `${SITE.copyrightStartYear}`;

  return (
    <p className="text-sm text-muted-foreground">
      © {range} {SITE.brand}.
    </p>
  );
}
