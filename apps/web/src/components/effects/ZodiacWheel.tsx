import { cn } from "@/lib/cn";

// U+FE0E asks for the text (line) glyph instead of the colour emoji on iOS/Android.
const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => `${g}︎`);
const C = 200;

const polar = (r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [+(C + r * Math.cos(rad)).toFixed(2), +(C + r * Math.sin(rad)).toFixed(2)] as const;
};

// Sign separators on the outer ring.
const SPOKES = Array.from({ length: 12 }, (_, i) => [polar(160, i * 30), polar(196, i * 30)] as const);
// {12/5} star polygon — the mandala at the centre.
const STAR = Array.from({ length: 12 }, (_, i) => polar(150, (i * 5 * 30) % 360).join(",")).join(" ");
// Two interlaced hexagrams inside it.
const HEX_A = Array.from({ length: 6 }, (_, i) => polar(104, i * 60).join(",")).join(" ");
const HEX_B = Array.from({ length: 6 }, (_, i) => polar(104, i * 60 + 30).join(",")).join(" ");
const PETALS = Array.from({ length: 12 }, (_, i) => i * 30);
const DOTS = Array.from({ length: 24 }, (_, i) => polar(156, i * 15));

/**
 * Gold zodiac wheel (design.md §9.1): 12 rashi glyphs on a ring and yantra-style line work inside.
 * Decorative only; rotates once per 120s when `spinning` (frozen under reduced motion).
 */
export function ZodiacWheel({ size = 360, className, spinning = true }: { size?: number; className?: string; spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none h-auto max-w-full select-none text-gold-300", spinning && "animate-wheel motion-reduce:animate-none", className)}
    >
      <defs>
        <radialGradient id="amx-wheel-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity=".22" />
          <stop offset="55%" stopColor="#7c3aed" stopOpacity=".08" />
          <stop offset="100%" stopColor="#07060f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={198} fill="url(#amx-wheel-glow)" />
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx={C} cy={C} r={196} strokeOpacity=".55" strokeWidth="1.5" />
        <circle cx={C} cy={C} r={188} strokeOpacity=".18" strokeWidth="1" />
        <circle cx={C} cy={C} r={160} strokeOpacity=".5" strokeWidth="1.2" />
        <circle cx={C} cy={C} r={150} strokeOpacity=".2" strokeWidth="1" strokeDasharray="2 6" />
        {SPOKES.map(([a, b], i) => (
          <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeOpacity=".4" strokeWidth="1" />
        ))}
        <polygon points={STAR} strokeOpacity=".28" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={HEX_A} strokeOpacity=".4" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={HEX_B} strokeOpacity=".4" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx={C} cy={C} r={104} strokeOpacity=".3" strokeWidth="1" />
        {PETALS.map((deg) => (
          <ellipse
            key={deg}
            cx={C}
            cy={C - 40}
            rx={11}
            ry={30}
            transform={`rotate(${deg} ${C} ${C})`}
            strokeOpacity=".35"
            strokeWidth="1"
          />
        ))}
        <circle cx={C} cy={C} r={18} strokeOpacity=".6" strokeWidth="1.2" />
      </g>
      <g fill="currentColor">
        {DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1 : 1.8} fillOpacity={i % 2 ? 0.35 : 0.7} />
        ))}
        <circle cx={C} cy={C} r={4} fillOpacity=".9" />
      </g>
      <g
        fill="#fde7b0"
        fontSize="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Segoe UI Symbol','Noto Sans Symbols 2','Noto Sans Symbols','Apple Symbols',sans-serif"
      >
        {SIGNS.map((glyph, i) => (
          <text key={i} x={C} y={C - 176} transform={`rotate(${i * 30 + 15} ${C} ${C})`} fillOpacity=".92">
            {glyph}
          </text>
        ))}
      </g>
    </svg>
  );
}
