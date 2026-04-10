import { createClient } from "@/lib/supabase/server";
import { paypalRequest, PRICING } from "@/lib/paypal";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { additional_frameworks = 0 } = body;

  // Get user's team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  // Calculate total
  const baseAmount = parseFloat(PRICING.PRO_PLAN_MONTHLY);
  const addonAmount = parseFloat(PRICING.ADDON_FRAMEWORK_MONTHLY) * additional_frameworks;
  const totalAmount = (baseAmount + addonAmount).toFixed(2);

  try {
    // Create a PayPal order
    const order = await paypalRequest("/v2/checkout/orders", "POST", {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalAmount,
            breakdown: {
              item_total: { currency_code: "USD", value: totalAmount },
            },
          },
          items: [
            {
              name: "RubricCoach Pro Plan",
              description: "Monthly subscription — includes 1 framework",
              unit_amount: { currency_code: "USD", value: PRICING.PRO_PLAN_MONTHLY },
              quantity: "1",
              category: "DIGITAL_GOODS",
            },
            ...(additional_frameworks > 0
              ? [
                  {
                    name: "Additional Framework",
                    description: "$5/month per additional framework",
                    unit_amount: { currency_code: "USD", value: PRICING.ADDON_FRAMEWORK_MONTHLY },
                    quantity: additional_frameworks.toString(),
                    category: "DIGITAL_GOODS" as const,
                  },
                ]
              : []),
          ],
          custom_id: JSON.stringify({
            team_id: membership.team_id,
            additional_frameworks,
          }),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "RubricCoach",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
          },
        },
      },
    });

    // Find the approval link
    const approvalLink = order.links?.find(
      (l: { rel: string; href: string }) => l.rel === "payer-action" || l.rel === "approve"
    );

    if (!approvalLink) {
      return NextResponse.json({ error: "No approval link returned" }, { status: 500 });
    }

    return NextResponse.json({
      order_id: order.id,
      url: approvalLink.href,
    });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
