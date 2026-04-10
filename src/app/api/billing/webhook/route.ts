import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// PayPal webhook handler
// Set up at developer.paypal.com > Webhooks with your Vercel URL + /api/billing/webhook
export async function POST(request: Request) {
  const body = await request.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const eventType = body.event_type;

  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED": {
      const capture = body.resource;
      const customId = capture?.custom_id;

      if (customId) {
        try {
          const parsed = JSON.parse(customId);
          const teamId = parsed.team_id;
          const additionalFrameworks = parsed.additional_frameworks || 0;

          if (teamId) {
            await supabase
              .from("subscriptions")
              .update({
                plan: "pro",
                status: "active",
                framework_slots: 1 + additionalFrameworks,
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq("team_id", teamId);
          }
        } catch { /* ignore parse errors */ }
      }
      break;
    }

    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED": {
      // Downgrade on refund
      const capture = body.resource;
      const customId = capture?.custom_id;

      if (customId) {
        try {
          const parsed = JSON.parse(customId);
          if (parsed.team_id) {
            await supabase
              .from("subscriptions")
              .update({
                plan: "base",
                status: "canceled",
                framework_slots: 1,
              })
              .eq("team_id", parsed.team_id);
          }
        } catch { /* ignore */ }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
