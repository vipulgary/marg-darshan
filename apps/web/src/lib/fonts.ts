import { Fraunces, Mukta, Plus_Jakarta_Sans, Tiro_Devanagari_Hindi } from "next/font/google";

// AMX-011: Latin + Devanagari pairs (design.md §2.1). Variables are consumed in globals.css.
export const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
export const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
export const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});
export const tiro = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: "400",
  variable: "--font-tiro",
  display: "swap",
});

export const fontVariables = [fraunces.variable, jakarta.variable, mukta.variable, tiro.variable].join(" ");
