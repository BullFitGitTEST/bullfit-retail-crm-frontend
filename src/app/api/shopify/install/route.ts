import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/shopify/install?shop=mystore.myshopify.com
 *
 * Initiates the Shopify OAuth flow by redirecting the user to
 * Shopify's authorization page with the correct client_id, scopes,
 * redirect_uri, and a CSRF state nonce.
 */
export async function GET(req: NextRequest) {
  const shop =
    req.nextUrl.searchParams.get("shop") ||
    process.env.SHOPIFY_STORE_DOMAIN;

  if (!shop) {
    return NextResponse.json(
      { error: "shop query parameter is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.SHOPIFY_APP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SHOPIFY_APP_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const scopes =
    process.env.SHOPIFY_SCOPES ||
    "read_products,read_inventory,read_orders,read_locations";

  // Build the callback URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL ||
    `https://${req.headers.get("host")}`;
  const redirectUri = `${baseUrl}/api/shopify/callback`;

  // Generate a random state nonce for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Store state in a secure, httpOnly cookie (expires in 10 minutes)
  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());

  // Set state cookie for verification in callback
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  // Also store the shop domain for the callback
  response.cookies.set("shopify_oauth_shop", shop, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
