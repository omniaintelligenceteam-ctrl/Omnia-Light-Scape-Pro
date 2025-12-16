export type Plan = {
  key: string;
  name: string;
  priceMonthlyUsd: number;
  creditsPerMonth: number;
  paypalPlanId?: string;
};

export const PLANS: Plan[] = [
  { key: "starter_15", name: "Starter", priceMonthlyUsd: 29, creditsPerMonth: 15, paypalPlanId: "" },
  { key: "pro_100", name: "Pro 100", priceMonthlyUsd: 79, creditsPerMonth: 100, paypalPlanId: "" },
  { key: "pro_250", name: "Pro 250", priceMonthlyUsd: 149, creditsPerMonth: 250, paypalPlanId: "" },
  { key: "pro_500", name: "Pro 500", priceMonthlyUsd: 249, creditsPerMonth: 500, paypalPlanId: "" },
  { key: "pro_1000", name: "Pro 1000", priceMonthlyUsd: 399, creditsPerMonth: 1000, paypalPlanId: "" },
];
