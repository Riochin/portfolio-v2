import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { works } from "@/data/works";

export const metadata: Metadata = {
  title: "Works",
};

export default function WorksPage() {
  return (
    <PageShell wide>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => {
          const href =
            work.links.demo ?? work.links.repo ?? work.links.article;

          const tile = (
            <>
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-accent/25 to-accent/5">
                {work.image && (
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <p className="mt-3 text-sm">{work.title}</p>
            </>
          );

          return (
            <li key={work.title} className="group">
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {tile}
                </a>
              ) : (
                tile
              )}
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
