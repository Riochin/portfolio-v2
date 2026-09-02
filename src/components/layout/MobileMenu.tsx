"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SideNav, type NavItem } from "./SideNav";
import { SocialLinks } from "./SocialLinks";

export type MenuLabels = {
  readonly open: string;
  readonly close: string;
  readonly mainNav: string;
};

export function MobileMenu({
  items,
  heading,
  headingHref,
  labels,
  languageSwitcher,
}: {
  items: readonly NavItem[];
  heading: string;
  headingHref: string;
  labels: MenuLabels;
  /** Server Component 側で組み立てたものを slot として受け取る */
  languageSwitcher: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-foreground"
      >
        <Menu size={22} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-6 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.close}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground"
          >
            <X size={22} />
          </button>
          <div
            className="mt-10 flex flex-1 flex-col gap-10 text-lg"
            onClick={() => setOpen(false)}
          >
            <SideNav
              items={items}
              heading={heading}
              headingHref={headingHref}
              ariaLabel={labels.mainNav}
            />
            <SocialLinks direction="row" />
            {languageSwitcher}
          </div>
        </div>
      )}
    </div>
  );
}
