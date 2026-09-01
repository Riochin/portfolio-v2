import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { experiences } from "@/data/experience";

export const metadata: Metadata = {
  title: "Experience",
};

export default function ExperiencePage() {
  return (
    <PageShell>
      <ul className="space-y-8">
        {experiences.map((exp) => (
          <li
            key={`${exp.organization}-${exp.period}`}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold">{exp.organization}</h2>
              <span className="shrink-0 text-sm text-muted-foreground">
                {exp.period}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{exp.position}</p>
            <p className="mt-3 leading-relaxed">{exp.description}</p>
            {exp.stack && (
              <div className="mt-4 flex flex-wrap gap-2">
                {exp.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border px-3 py-0.5 text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
