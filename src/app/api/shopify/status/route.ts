import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

/**
 * GET /api/shopify/status
 *
 * Returns whether a Shopify store is connected (credentials exist).
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ro_shopify_credentials")
      .select("store_domain, scopes, installed_at")
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table might not exist yet — treat as not connected
      return NextResponse.json({ connected: false, store_domain: null });
    }

    if (!data) {
      return NextResponse.json({ connected: false, store_domain: null });
    }

    return NextResponse.json({
      connected: true,
      store_domain: data.store_domain,
      scopes: data.scopes,
      installed_at: data.installed_at,
    });
  } catch {
    return NextResponse.json({ connected: false, store_domain: null });
  }
}

/**
 * DELETE /api/shopify/status
 *
 * Disconnect: removes stored credentials.
 */
export async function DELETE() {
  try {
    const { error } = await supabase
      .from("ro_shopify_credentials")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

    if (error) throw error;
    return NextResponse.json({ disconnected: true });
  } catch (err) {
    console.error("Failed to disconnect Shopify:", err);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
