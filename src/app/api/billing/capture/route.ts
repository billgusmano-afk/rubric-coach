import { createClient } from "@/lib/supabase/server";
import { paypalRequest } from "@/lib/paypal";
import { NextResponse } from "next/server";

// POST /api/billing/capture — capture a PayPal order after user approval
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { order_id } = await request.json();

  if (!order_id) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  try {
    // Capture the payment
    const capture = await paypalRequest(`/v2/checkout/orders/${order_id}/capture`, "POST");

    if (capture.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed", status: capture.status }, { status: 400 });
    }

    // Extract metadata from custom_id
    const purchaseUnit = capture.purchase_units?.[0];
    const customData = purchaseUnit?.payments?.captures?.[0]?.custom_id
      || purchaseUnit?.custom_id;

    let teamId: string | null = null;
    let additionalFrameworks = 0;

    if (customData) {
      try {
        const parsed = JSON.parse(customData);
        teamId = parsed.team_id;
        additionalFrameworks = parsed.additional_frameworks || 0;
      } catch {
        // Try to get team from user
      }
    }

    // Fallback: get team from user
    if (!teamId) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      teamId = membership?.team_id || null;
    }

    if (!teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 400 });
    }

    // Update subscription
    const paypalOrderId = capture.id;
    const payerEmail = capture.payer?.email_address;

    await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: payerEmail || null, // reuse column for PayPal payer email
        stripe_subscription_id: paypalOrderId, // reuse column for PayPal order ID
        plan: "pro",
        status: "active",
        framework_slots: 1 + additionalFrameworks,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("team_id", teamId);

    return NextResponse.json({ success: true, order_id: paypalOrderId });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json({ error: "Failed to capture payment" }, { status: 500 });
  }
}
