"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Half-filled form data survives a language switch (AMX-021): forms read/write
 * through this store, which is persisted to sessionStorage per tab.
 */
type Drafts = Record<string, Record<string, unknown>>;

interface FormDraftState {
  drafts: Drafts;
  setField: (form: string, field: string, value: unknown) => void;
  clear: (form: string) => void;
}

export const useFormDraft = create<FormDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setField: (form, field, value) =>
        set((s) => ({ drafts: { ...s.drafts, [form]: { ...s.drafts[form], [field]: value } } })),
      clear: (form) =>
        set((s) => {
          const rest = { ...s.drafts };
          delete rest[form];
          return { drafts: rest };
        }),
    }),
    { name: "astromax-form-drafts", storage: createJSONStorage(() => sessionStorage) },
  ),
);

/** Convenience hook: [value, setValue] bound to one draft field. */
export function useDraftField<T>(form: string, field: string, fallback: T): [T, (v: T) => void] {
  const value = useFormDraft((s) => s.drafts[form]?.[field]) as T | undefined;
  const setField = useFormDraft((s) => s.setField);
  return [value ?? fallback, (v: T) => setField(form, field, v)];
}
