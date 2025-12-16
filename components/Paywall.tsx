import React, { useMemo, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { X } from "lucide-react";

// NOTE: This import path assumes:
// - Paywall.tsx is in /components (project root)
// - plans.ts is in /src/billing/plans.ts
import { PLANS, type Plan } from "../src/billing/plans";

function getDeviceId() {
  const key = "device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto as any)?.randomUUID
      ? (crypto as any).randomUUID()
      : `dev-${Date.now()}-${Math.random()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPaid: () => void;
};

export function Paywall({ isOpen, onClose, onPaid }: Props) {
  // SAFE: never crash if env is missing
  const PAYPAL_CLIENT_ID = (import.meta as any)?.env?.VITE_PAYPAL_CLIENT_ID ?? "";

  const firstPlanKey = PLANS?.[0]?.key ?? "";
  const [selectedKey, setSelectedKey] = useState<string>(firstPlanKey);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedPlan: Plan | undefined = useMemo(
    () => PLANS.find((p) => p.key === selectedKey) ?? PLANS[0],
    [selectedKey]
  );

  if (!isOpen) return null;

  const devBypassEnabled = localStorage.getItem("dev_bypass") === "1";

  const handleDevUnlock = () => {
    localStorage.setItem("dev_bypass", "1");
    getDeviceId();
    onPaid();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <div className="text-lg font-bold">Upgrade</div>
            <div className="text-xs text-gray-500">
              Monthly subscription. Credits reset every month.
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close paywall"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {/* If PayPal isn't configured, show DEV unlock */}
          {!PAYPAL_CLIENT_ID && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
              <div className="font-bold">PayPal not configured</div>
              <div className="mt-1">
                Missing <code>VITE_PAYPAL_CLIENT_ID</code>.
              </div>

              <button
                onClick={handleDevUnlock}
                className="mt-3 w-full rounded-lg bg-black py-3 text-xs font-bold uppercase tracking-widest text-white"
                type="button"
              >
                {devBypassEnabled ? "DEV: Unlocked (Close)" : "DEV: Unlock (skip PayPal for now)"}
              </button>
            </div>
          )}

          {/* Plan picker */}
          <div className="grid gap-2 mt-3">
            {PLANS.map((p) => {
              const active = p.key === selectedKey;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedKey(p.key)}
                  type="button"
                  className={`text-left px-4 py-3 rounded-xl border transition ${
                    active
                      ? "border-[#111] bg-gray-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-bold">{p.name}</div>
                    <div className="font-bold">${p.priceMonthlyUsd.toFixed(2)}/mo</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {p.creditsPerMonth} generations / month
                  </div>
                </button>
              );
            })}
          </div>

          {err && (
            <div className="mt-3 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
              {err}
            </div>
          )}

          {/* Only render PayPal buttons if client id exists */}
          {!!PAYPAL_CLIENT_ID && (
            <>
              {!selectedPlan?.paypalPlanId ? (
                <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                  PayPal Plan ID not set for <b>{selectedPlan?.name}</b> yet.
                </div>
              ) : (
                <div className="mt-4">
                  <PayPalScriptProvider
                    options={
                      {
                        "client-id": PAYPAL_CLIENT_ID,
                        intent: "subscription",
                        vault: true,
                      } as any
                    }
                  >
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      disabled={busy}
                      createSubscription={(_data, actions) => {
                        setErr(null);
                        return actions.subscription.create({
                          plan_id: selectedPlan.paypalPlanId!,
                        });
                      }}
                      onApprove={async (data) => {
                        try {
                          setBusy(true);
                          setErr(null);

                          const subscriptionID = (data as any).subscriptionID;
                          if (!subscriptionID) throw new Error("Missing subscriptionID");

                          const verifyResp = await fetch("/api/paypal/verify-subscription", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ subscriptionID }),
                          });
                          const verify = await verifyResp.json();
                          if (!verifyResp.ok || !verify.active) {
                            throw new Error(verify?.error || "Subscription not active");
                          }

                          const registerResp = await fetch("/api/billing/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              subscriptionID,
                              planKey: selectedPlan.key,
                              deviceId: getDeviceId(),
                            }),
                          });
                          const reg = await registerResp.json();
                          if (!registerResp.ok) throw new Error(reg?.error || "Failed to register");

                          localStorage.setItem("paypal_subscription_id", subscriptionID);
                          localStorage.setItem("plan_key", selectedPlan.key);

                          onPaid();
                          onClose();
                        } catch (e: any) {
                          setErr(e?.message || "Payment failed.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
            </>
          )}

          <div className="mt-4 text-[11px] text-gray-500">
            Subscription access is tied to this browser/device.
          </div>
        </div>
      </div>
    </div>
  );
}