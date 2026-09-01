import { Copyright } from "./Copyright";
import { MobileMenu } from "./MobileMenu";
import { SideNav } from "./SideNav";

export function SiteChrome() {
  return (
    <>
      <MobileMenu />
      <div className="fixed left-[10%] top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-16 md:flex">
        <SideNav />
        <Copyright />
      </div>
    </>
  );
}
