"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getProblem } from "@/content/catalog";
import {
  type BookingDraft,
  LAST_STEP,
  type LifeEventDraft,
  UUID_RE,
  emptyDraft,
  firstIncompleteStep,
} from "@/lib/booking/draft";
import { MIN_LIFE_EVENTS, serviceForProblem } from "@/lib/booking/schemas";

interface BookingState extends BookingDraft {
  /** +1 forward / -1 back — drives the slide direction; not persisted */
  direction: 1 | -1;
  update: (patch: Partial<BookingDraft>) => void;
  selectProblem: (slug: string) => void;
  setMode: (mode: BookingDraft["mode"]) => void;
  setDuration: (min: number) => void;
  setTimeUnknown: (v: boolean) => void;
  addLifeEvent: () => void;
  updateLifeEvent: (id: string, patch: Partial<Omit<LifeEventDraft, "id">>) => void;
  removeLifeEvent: (id: string) => void;
  goTo: (step: number) => void;
  applyDeepLink: (q: { problem?: string | null; profile?: string | null }) => void;
  reset: () => void;
}

let seq = 0;
const newEvent = (): LifeEventDraft => ({ id: `ev-${Date.now().toString(36)}-${seq++}`, type: "", date: "" });
const seedEvents = (events: LifeEventDraft[]) =>
  events.length >= MIN_LIFE_EVENTS ? events : [...events, ...Array.from({ length: MIN_LIFE_EVENTS - events.length }, newEvent)];

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      ...emptyDraft,
      direction: 1,
      update: (patch) => set(patch),
      selectProblem: (slug) => {
        const problem = getProblem(slug);
        if (!problem) return;
        const prev = serviceForProblem(get().problemSlug);
        const next = serviceForProblem(slug)!;
        if (prev?.slug === next.slug) return set({ problemSlug: slug });
        set({
          problemSlug: slug,
          mode: next.modes.length === 1 ? next.modes[0] : "",
          durationMin: next.durations.includes(problem.defaultDuration) ? problem.defaultDuration : next.durations[0],
          slotStart: null,
          slotDate: null,
          planType: "FULL_UPFRONT",
          lifeEvents: next.type === "RECTIFICATION" ? seedEvents(get().lifeEvents) : get().lifeEvents,
        });
      },
      setMode: (mode) => set({ mode }),
      // availability depends on duration, so a new duration drops the chosen slot
      setDuration: (durationMin) => set((s) => (s.durationMin === durationMin ? {} : { durationMin, slotStart: null })),
      setTimeUnknown: (timeUnknown) => set((s) => ({ timeUnknown, lifeEvents: timeUnknown ? seedEvents(s.lifeEvents) : s.lifeEvents })),
      addLifeEvent: () => set((s) => ({ lifeEvents: [...s.lifeEvents, newEvent()] })),
      updateLifeEvent: (id, patch) => set((s) => ({ lifeEvents: s.lifeEvents.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeLifeEvent: (id) => set((s) => ({ lifeEvents: s.lifeEvents.filter((e) => e.id !== id) })),
      goTo: (step) => {
        const target = Math.max(0, Math.min(LAST_STEP, step));
        const allowed = Math.min(target, firstIncompleteStep(get(), target));
        set((s) => ({ step: allowed, direction: allowed >= s.step ? 1 : -1 }));
      },
      applyDeepLink: ({ problem, profile }) => {
        if (profile && UUID_RE.test(profile) && get().birthProfileId !== profile) set({ birthProfileId: profile });
        if (problem && getProblem(problem) && get().problemSlug !== problem) {
          get().selectProblem(problem);
          set({ step: 1, direction: 1 });
        }
      },
      reset: () => set({ ...emptyDraft, direction: -1 }),
    }),
    {
      name: "astromax-booking",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([k, v]) => k !== "direction" && typeof v !== "function"),
        ) as Partial<BookingState>,
    },
  ),
);
