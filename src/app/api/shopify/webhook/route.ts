import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";

/**
 * Verify Shopify webhook HMAC signature.
 */
async function verifyWebhook(
  req: NextRequest,
  body: string
): Promise<boolean> {
  if (!SHOPIFY_WEBHOOK_SECRET) return true; // Skip in dev

  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SHOPIFY_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return computed === hmacHeader;
}

// POST /api/shopify/webhook — Shopify webhook receiver
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const isValid = await verifyWebhook(req, rawBody);

    if (!isValid) {
      console.error("Shopify webhook: invalid HMAC signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const topic = req.headers.get("x-shopify-topic") || "unknown";
    const payload = JSON.parse(rawBody);

    // Store the event
    const { error } = await supabase.from("ro_shopify_webhook_events").insert({
      topic,
      payload,
      status: "pending",
    });

    if (error) {
      console.error("Webhook store error:", error);
    }

    // Process specific topics (fire-and-forget for now)
    // Future: process product updates, inventory changes, order completions
    // in a background queue

    // Mark as processed
    if (!error) {
      // We can process inline for now since these are quick operations
      console.log(`Shopify webhook received: ${topic}`);
    }

    return NextResponse.json({ received: true, topic });
  } catch (err) {
    console.error("Shopify webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
