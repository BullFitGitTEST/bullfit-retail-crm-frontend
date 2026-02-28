import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { encryptToken } from "@/lib/shopify/encryption";

/**
 * GET /api/shopify/callback?code=...&hmac=...&shop=...&state=...&timestamp=...
 *
 * Shopify redirects here after the merchant approves the OAuth request.
 * We verify the HMAC + state, exchange the code for an access token,
 * encrypt it, and store it in Supabase.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const hmac = searchParams.get("hmac");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  const settingsUrl = "/settings/integrations/shopify";

  // ── Validate required params ──────────────────────────────────────

  if (!code || !hmac || !shop || !state) {
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=missing_params`, req.url)
    );
  }

  // ── Verify CSRF state ─────────────────────────────────────────────

  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=invalid_state`, req.url)
    );
  }

  // ── Verify HMAC signature ─────────────────────────────────────────

  const secret = process.env.SHOPIFY_APP_API_SECRET;
  if (!secret) {
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=server_config`, req.url)
    );
  }

  // Build the message string from all query params except hmac
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "hmac") params.append(key, value);
  });
  // Sort params alphabetically
  const sortedParams = new URLSearchParams(
    [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  );
  const message = sortedParams.toString();

  const digest = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(digest, "hex"),
      Buffer.from(hmac, "hex")
    )
  ) {
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=invalid_hmac`, req.url)
    );
  }

  // ── Exchange code for access token ────────────────────────────────

  const apiKey = process.env.SHOPIFY_APP_API_KEY;
  if (!apiKey) {
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=server_config`, req.url)
    );
  }

  let accessToken: string;
  let grantedScopes: string;

  try {
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: secret,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Shopify token exchange failed:", tokenRes.status, errBody);
      return NextResponse.redirect(
        new URL(`${settingsUrl}?error=token_exchange`, req.url)
      );
    }

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    grantedScopes = tokenData.scope || "";
  } catch (err) {
    console.error("Shopify token exchange error:", err);
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=token_exchange`, req.url)
    );
  }

  // ── Encrypt and store ─────────────────────────────────────────────

  try {
    const encryptedToken = encryptToken(accessToken);

    const { error } = await supabase.from("ro_shopify_credentials").upsert(
      {
        store_domain: shop,
        encrypted_access_token: encryptedToken,
        scopes: grantedScopes,
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_domain" }
    );

    if (error) {
      console.error("Failed to store Shopify credentials:", error);
      return NextResponse.redirect(
        new URL(`${settingsUrl}?error=storage`, req.url)
      );
    }
  } catch (err) {
    console.error("Encryption/storage error:", err);
    return NextResponse.redirect(
      new URL(`${settingsUrl}?error=storage`, req.url)
    );
  }

  // ── Clean up cookies and redirect ─────────────────────────────────

  const response = NextResponse.redirect(
    new URL(`${settingsUrl}?connected=true`, req.url)
  );
  response.cookies.delete("shopify_oauth_state");
  response.cookies.delete("shopify_oauth_shop");
  return response;
}
