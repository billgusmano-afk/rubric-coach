"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

interface SubscriptionData {
  plan: string;
  status: string;
  framework_slots: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [frameworkCount, setFrameworkCount] = useState(0);
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get team
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      // Get subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("team_id", membership.team_id)
        .single();

      if (sub) setSubscription(sub);

      // Count frameworks
      const { count: fwCount } = await supabase
        .from("frameworks")
        .select("id", { count: "exact", head: true })
        .eq("team_id", membership.team_id);

      setFrameworkCount(fwCount || 0);

      // Count team members
      const { count: tmCount } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", membership.team_id);

      setTeamMemberCount(tmCount || 0);

      setLoading(false);
    }
    load();
  }, []);

  // After PayPal redirect back, capture the payment
  useEffect(() => {
    async function capturePayment() {
      const token = searchParams.get("token"); // PayPal order ID
      if (!token || !success) return;

      try {
        const res = await fetch("/api/billing/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: token }),
        });
        if (res.ok) {
          // Reload to show updated plan
          window.location.href = "/dashboard/settings/billing?success=true";
        }
      } catch { /* ignore */ }
    }

    // Only capture if we have a token (fresh return from PayPal)
    if (searchParams.get("token") && success) {
      capturePayment();
    }
  }, [searchParams, success]);

  async function handleUpgrade(additionalFrameworks: number) {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additional_frameworks: additionalFrameworks,
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch { /* ignore */ }
    finally { setCheckoutLoading(false); }
  }

  async function handleManagePlan() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal");
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch { /* ignore */ }
    finally { setPortalLoading(false); }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-[960px]">
        <div className="text-ink-3 text-sm">Loading billing info...</div>
      </div>
    );
  }

  const isFreePlan = !subscription?.stripe_subscription_id && subscription?.plan !== "pro";
  const slotsUsed = frameworkCount;
  const slotsTotal = subscription?.framework_slots || 1;

  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">Billing &amp; Plan</h1>
        <p className="text-ink-3 text-sm">Manage your subscription and payment methods</p>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green/10 border border-green/20 rounded-sm text-green text-sm">
          Payment successful! Your plan has been updated.
        </div>
      )}
      {canceled && (
        <div className="mb-4 p-3 bg-gold/10 border border-gold/20 rounded-sm text-gold text-sm">
          Checkout was canceled. No changes were made.
        </div>
      )}

      {/* Current plan */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="font-semibold text-sm mb-4">Current Plan</div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              isFreePlan
                ? "bg-surface text-ink-3"
                : "bg-accent/10 text-accent"
            }`}>
              {isFreePlan ? "Free" : "Pro"}
            </span>
            <span className={`text-xs ${
              subscription?.status === "active" ? "text-green" : "text-ink-3"
            }`}>
              {subscription?.status || "active"}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-3">Framework slots</span>
              <span className="font-medium">{slotsUsed} / {slotsTotal}</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${slotsUsed >= slotsTotal ? "bg-red" : "bg-accent"}`}
                style={{ width: `${Math.min((slotsUsed / slotsTotal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3">Team members</span>
              <span className="font-medium">{teamMemberCount}</span>
            </div>
            {subscription?.current_period_end && (
              <div className="flex justify-between">
                <span className="text-ink-3">Next billing</span>
                <span className="font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {!isFreePlan && (
            <button
              onClick={handleManagePlan}
              disabled={portalLoading}
              className="mt-4 w-full py-2 bg-white text-accent border border-border rounded-sm text-sm font-medium hover:border-accent transition-colors disabled:opacity-50"
            >
              {portalLoading ? "Loading..." : "Manage Plan"}
            </button>
          )}
        </div>

        {/* Payment methods info */}
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="font-semibold text-sm mb-4">Payment Methods</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surface rounded-sm">
              <div className="w-10 h-7 bg-ink/10 rounded flex items-center justify-center text-[10px] font-bold text-ink-3">VISA</div>
              <div className="flex-1">
                <div className="text-sm font-medium">Credit / Debit Card</div>
                <div className="text-xs text-ink-3">Visa, Mastercard, Amex</div>
              </div>
              <span className="inline-flex px-2 py-0.5 bg-green/10 text-green text-[10px] font-semibold rounded-full">Supported</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface rounded-sm">
              <div className="w-10 h-7 bg-[#0070ba]/10 rounded flex items-center justify-center text-[10px] font-bold text-[#0070ba]">PP</div>
              <div className="flex-1">
                <div className="text-sm font-medium">PayPal</div>
                <div className="text-xs text-ink-3">Pay with your PayPal account</div>
              </div>
              <span className="inline-flex px-2 py-0.5 bg-green/10 text-green text-[10px] font-semibold rounded-full">Supported</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-ink-3">
            Payments are processed securely through PayPal. You can pay with your PayPal account or credit/debit card.
          </div>
        </div>
      </div>

      {/* Upgrade options */}
      <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
        <div className="font-semibold text-sm mb-4">
          {isFreePlan ? "Upgrade Your Plan" : "Add More Frameworks"}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Pro plan */}
          <div className={`border rounded-[12px] p-5 ${
            !isFreePlan ? "border-accent bg-accent/[0.03]" : "border-border"
          }`}>
            <div className="font-semibold text-sm mb-1">Pro Plan</div>
            <div className="text-2xl font-bold text-ink mb-1">
              $29<span className="text-sm font-normal text-ink-3">/mo</span>
            </div>
            <div className="text-xs text-ink-3 mb-4">Includes 1 framework</div>
            <ul className="space-y-1.5 text-xs text-ink-3 mb-4">
              <li>{"\u2713"} Unlimited roleplay sessions</li>
              <li>{"\u2713"} AI coaching &amp; scoring</li>
              <li>{"\u2713"} Client research</li>
              <li>{"\u2713"} Session history &amp; analytics</li>
              <li>{"\u2713"} Credit card &amp; PayPal</li>
            </ul>
            {isFreePlan ? (
              <button
                onClick={() => handleUpgrade(0)}
                disabled={checkoutLoading}
                className="w-full py-2 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? "Loading..." : "Upgrade to Pro"}
              </button>
            ) : (
              <div className="text-center text-xs text-accent font-medium">Current Plan</div>
            )}
          </div>

          {/* +1 Framework */}
          <div className="border border-border rounded-[12px] p-5">
            <div className="font-semibold text-sm mb-1">+1 Framework</div>
            <div className="text-2xl font-bold text-ink mb-1">
              +$5<span className="text-sm font-normal text-ink-3">/user/mo</span>
            </div>
            <div className="text-xs text-ink-3 mb-4">Add a second rubric</div>
            <div className="text-xs text-ink-3 mb-4">
              Total: {isFreePlan ? "$34" : "$34"}/mo for {teamMemberCount} user{teamMemberCount !== 1 ? "s" : ""}
            </div>
            <button
              onClick={() => handleUpgrade(1)}
              disabled={checkoutLoading}
              className="w-full py-2 bg-white text-accent border border-border rounded-sm text-sm font-medium hover:border-accent transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? "Loading..." : "Add Framework"}
            </button>
          </div>

          {/* +2 Frameworks */}
          <div className="border border-border rounded-[12px] p-5">
            <div className="font-semibold text-sm mb-1">+2 Frameworks</div>
            <div className="text-2xl font-bold text-ink mb-1">
              +$10<span className="text-sm font-normal text-ink-3">/user/mo</span>
            </div>
            <div className="text-xs text-ink-3 mb-4">Add two more rubrics</div>
            <div className="text-xs text-ink-3 mb-4">
              Total: {isFreePlan ? "$39" : "$39"}/mo for {teamMemberCount} user{teamMemberCount !== 1 ? "s" : ""}
            </div>
            <button
              onClick={() => handleUpgrade(2)}
              disabled={checkoutLoading}
              className="w-full py-2 bg-white text-accent border border-border rounded-sm text-sm font-medium hover:border-accent transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? "Loading..." : "Add 2 Frameworks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
