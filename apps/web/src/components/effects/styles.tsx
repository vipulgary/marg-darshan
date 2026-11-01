/**
 * Shared keyframes and default classes for the effects (design.md §9). React 19 hoists and
 * de-duplicates a <style href precedence> into <head>, so every effect can render this freely.
 * Defaults live in @layer components so a consumer's Tailwind utilities always win.
 */
const CSS = `
@keyframes amx-drift-a{0%,100%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(9%,-7%,0) scale(1.12)}66%{transform:translate3d(-7%,6%,0) scale(.92)}}
@keyframes amx-drift-b{0%,100%{transform:translate3d(0,0,0) scale(1.05)}50%{transform:translate3d(-10%,8%,0) scale(.9)}}
@keyframes amx-drift-c{0%,100%{transform:translate3d(0,0,0) scale(.95)}40%{transform:translate3d(6%,9%,0) scale(1.1)}80%{transform:translate3d(-5%,-4%,0) scale(1)}}
@keyframes amx-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
@keyframes amx-rotate{to{transform:rotate(360deg)}}
@layer components{
  .amx-blob{position:absolute;border-radius:9999px;will-change:transform;animation:var(--amx-anim) ease-in-out infinite}
  .amx-gb{position:relative;isolation:isolate;overflow:hidden;padding:1.5px;border-radius:var(--radius-lg)}
  .amx-gb-spin{position:absolute;inset:-100%;z-index:-1;pointer-events:none;background:conic-gradient(from 0deg,#fcd98a,#db2777,#7c3aed,#fcd98a)}.light .amx-gb-spin{background:conic-gradient(from 0deg,#f5c26b,#f4735a,#9c4f3b,#f5c26b)}
  .amx-gb-spin[data-animated]{animation:amx-rotate 4s linear infinite}
  .amx-gb-inner{position:relative;height:100%;border-radius:inherit;background:var(--surface-1)}
  .amx-marquee{display:flex;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
  .amx-marquee-track{display:flex;width:max-content;flex-shrink:0;animation:amx-marquee var(--amx-dur,40s) linear infinite}
  .amx-marquee[data-reverse] .amx-marquee-track{animation-direction:reverse}
  .amx-marquee:hover .amx-marquee-track,.amx-marquee:focus-within .amx-marquee-track{animation-play-state:paused}
  .amx-marquee-copy{display:flex;flex-shrink:0;align-items:stretch;gap:var(--amx-gap,1rem);padding-inline-end:var(--amx-gap,1rem)}
}
@media (prefers-reduced-motion:reduce){
  .amx-blob,.amx-gb-spin[data-animated]{animation:none}
  .amx-marquee{-webkit-mask-image:none;mask-image:none}
  .amx-marquee-track{animation:none;width:100%}
  .amx-marquee-copy{flex-wrap:wrap;justify-content:center;padding-inline-end:0;width:100%}
  .amx-marquee-copy[data-dup]{display:none}
}
`;

export function EffectsStyles() {
  return (
    <style href="amx-effects" precedence="medium">
      {CSS}
    </style>
  );
}
