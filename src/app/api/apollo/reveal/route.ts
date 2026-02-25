import { NextRequest, NextResponse } from "next/server";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

export async function POST(req: NextRequest) {
  if (!APOLLO_API_KEY) {
    return NextResponse.json(
      { error: "Apollo API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { apolloId } = await req.json();

    if (!apolloId) {
      return NextResponse.json(
        { error: "apolloId is required" },
        { status: 400 }
      );
    }

    // Use people/match endpoint to reveal full contact data (costs 1 credit)
    const res = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        id: apolloId,
        reveal_personal_emails: false,
        reveal_phone_number: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Apollo reveal error: ${res.status} ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ person: data.person || data });
  } catch (error) {
    console.error("Apollo reveal error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
