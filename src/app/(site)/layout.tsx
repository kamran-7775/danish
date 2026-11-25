import type { ReactNode } from "react";
import Effects from "@/components/Effects";
import Intro from "@/components/Intro";
import ScrollHud from "@/components/ScrollHud";

/** Public site chrome: intro countdown, film grain, scroll HUD and the motion layer. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Before first paint: add "js" (so reveals never hide content without JS), and
          "is-loading" to play the intro once per session unless reduced motion is on. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var d=document.documentElement;d.classList.add('js');try{if(!sessionStorage.getItem('intro-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('is-loading')}catch(e){}})()",
        }}
      />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="grain" aria-hidden="true" />
      <Intro />
      {children}
      <ScrollHud />
      <Effects />
    </>
  );
}
