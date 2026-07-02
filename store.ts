import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { RateRow, CartItem, GstMode, ParseResult } from "./types";
import { ADJUST_MAX, ADJUST_MIN } from "./constants";
import { clamp } from "./calc";
import { FIXED_RATES, FIXED_RATE_FILENAME } from "./rateData";

interface AppState {
  // Rate list -----------------------------------------------------------
  rows: RateRow[];
  brands: string[];
  wireTypesByBrand: Record<string, string[]>;
  lengthsByBrand: Record<string, number[]>;
  fileName: string | null;
  loadedAt: string | null;

  // Order & controls ----------------------------------------------------
  cart: CartItem[];
  brandAdjust: Record<string, number>;
  wireType: Record<string, Record<number, string>>;
  lengthPref: Record<string, number | "cheapest">;
  gstMode: GstMode;

  // Actions -------------------------------------------------------------
  loadRates: (result: ParseResult, fileName: string) => void;
  clearRates: () => void;

  addToCart: (size: number, qty: number) => void;
  setCartQty: (size: number, qty: number) => void;
  removeFromCart: (size: number) => void;
  clearCart: () => void;

  setBrandAdjust: (brand: string, pct: number) => void;
  resetAdjustments: () => void;

  setWireType: (brand: string, size: number, wireType: string) => void;
  setLengthPref: (brand: string, length: number | "cheapest") => void;

  setGstMode: (mode: GstMode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // The rate list is fixed per the Excel and baked in, so the tool works
      // immediately with no upload. Uploading a new .xlsx still overrides it.
      rows: FIXED_RATES.rows,
      brands: FIXED_RATES.brands,
      wireTypesByBrand: FIXED_RATES.wireTypesByBrand,
      lengthsByBrand: FIXED_RATES.lengthsByBrand,
      fileName: FIXED_RATE_FILENAME,
      loadedAt: null,

      cart: [],
      brandAdjust: {},
      wireType: {},
      lengthPref: {},
      gstMode: 0,

      loadRates: (result, fileName) =>
        set(() => ({
          rows: result.rows,
          brands: result.brands,
          wireTypesByBrand: result.wireTypesByBrand,
          lengthsByBrand: result.lengthsByBrand,
          fileName,
          loadedAt: new Date().toISOString(),
        })),

      // "Clear" restores the built-in fixed rate list rather than emptying it.
      clearRates: () =>
        set(() => ({
          rows: FIXED_RATES.rows,
          brands: FIXED_RATES.brands,
          wireTypesByBrand: FIXED_RATES.wireTypesByBrand,
          lengthsByBrand: FIXED_RATES.lengthsByBrand,
          fileName: FIXED_RATE_FILENAME,
          loadedAt: null,
        })),

      addToCart: (size, qty) =>
        set((state) => {
          const q = Math.max(1, Math.round(qty));
          const existing = state.cart.find((c) => c.size === size);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.size === size ? { ...c, qty: q } : c
              ),
            };
          }
          return { cart: [...state.cart, { size, qty: q }] };
        }),

      setCartQty: (size, qty) =>
        set((state) => ({
          cart: state.cart.map((c) =>
            c.size === size ? { ...c, qty: Math.max(1, Math.round(qty)) } : c
          ),
        })),

      removeFromCart: (size) =>
        set((state) => ({ cart: state.cart.filter((c) => c.size !== size) })),

      clearCart: () => set(() => ({ cart: [] })),

      setBrandAdjust: (brand, pct) =>
        set((state) => ({
          brandAdjust: {
            ...state.brandAdjust,
            [brand]: clamp(Math.round(pct * 10) / 10, ADJUST_MIN, ADJUST_MAX),
          },
        })),

      resetAdjustments: () => set(() => ({ brandAdjust: {} })),

      setWireType: (brand, size, wireType) =>
        set((state) => ({
          wireType: {
            ...state.wireType,
            [brand]: { ...(state.wireType[brand] ?? {}), [size]: wireType },
          },
        })),

      setLengthPref: (brand, length) =>
        set((state) => ({
          lengthPref: { ...state.lengthPref, [brand]: length },
        })),

      setGstMode: (mode) => set(() => ({ gstMode: mode })),
    }),
    {
      name: "wire-bundle-estimator",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Only user choices (cart, discounts, GST, wire/length prefs) are
      // persisted — the rate list itself always comes from the built-in data
      // (or a fresh upload), so an old empty/stale persisted list can't hide it.
      partialize: (state) => ({
        cart: state.cart,
        brandAdjust: state.brandAdjust,
        wireType: state.wireType,
        lengthPref: state.lengthPref,
        gstMode: state.gstMode,
      }),
    }
  )
);

/**
 * Guard against SSR/client hydration mismatch: the persisted store is only
 * available in the browser, so components should wait until rehydration has
 * finished before rendering store-derived UI.
 */
export function useHydrated(): boolean {
  // Always start false so the server render and the first client render match;
  // flip to true after rehydration completes on the client.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
