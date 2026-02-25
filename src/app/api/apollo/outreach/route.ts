import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { person } = await req.json();

    const prompt = `Write a personalized B2B outreach email from BullFit (a fitness supplement brand) to a potential retail partner.

Recipient:
- Name: ${person.first_name} ${person.last_name}
- Title: ${person.title}
- Company: ${person.organization?.name}
- Industry: ${person.organization?.industry || "Fitness/Retail"}

Write a short (3-4 paragraph), professional but friendly cold email that:
1. Opens with something specific about their company
2. Explains BullFit's value proposition for retailers (premium supplements, strong margins, marketing support)
3. Proposes a quick call or meeting
4. Has a clear CTA

Tone: Direct, no-BS, results-focused. No generic fluff.
Return ONLY the email body (no subject line).`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a B2B sales expert for BullFit supplements. Write concise, personalized outreach.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `OpenAI error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      email: data.choices[0].message.content,
      subject: `Partnership opportunity for ${person.organization?.name || "your store"} — BullFit`,
    });
  } catch (error) {
    console.error("Outreach generation error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
