const PAYPAL_BASE = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

export async function paypalRequest(path: string, method = "GET", body?: unknown) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal API error: ${res.status} ${error}`);
  }

  // Some PayPal endpoints return 204 with no body
  if (res.status === 204) return null;
  return res.json();
}

// Pricing
export const PRICING = {
  PRO_PLAN_MONTHLY: "29.00",
  ADDON_FRAMEWORK_MONTHLY: "5.00",
};
