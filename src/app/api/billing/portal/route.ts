import { NextResponse } from "next/server";

// PayPal doesn't have a customer portal like Stripe.
// Redirect users to PayPal's activity page to manage payments.
export async function GET() {
  const paypalMode = process.env.PAYPAL_MODE === "live" ? "www" : "www.sandbox";
  return NextResponse.json({
    url: `https://${paypalMode}.paypal.com/myaccount/autopay/`,
  });
}
