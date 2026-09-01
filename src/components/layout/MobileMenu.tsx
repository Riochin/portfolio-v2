"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SideNav } from "./SideNav";
import { SocialLinks } from "./SocialLinks";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-foreground"
      >
        <Menu size={22} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-6 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground"
          >
            <X size={22} />
          </button>
          <div
            className="mt-10 flex flex-1 flex-col gap-10 text-lg"
            onClick={() => setOpen(false)}
          >
            <SideNav />
            <SocialLinks direction="row" />
          </div>
        </div>
      )}
    </div>
  );
}
