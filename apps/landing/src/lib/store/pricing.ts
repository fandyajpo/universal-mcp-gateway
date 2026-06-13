import { create } from "zustand";

type BillingPeriod = "monthly" | "annual";

interface PricingState {
  billingPeriod: BillingPeriod;
  setBillingPeriod: (period: BillingPeriod) => void;
}

export const usePricingStore = create<PricingState>()((set) => ({
  billingPeriod: "monthly",
  setBillingPeriod: (period: BillingPeriod): void => {
    set({ billingPeriod: period });
  },
}));
