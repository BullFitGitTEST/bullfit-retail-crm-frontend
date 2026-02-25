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
    const {
      keywords = [],
      personTitles = [],
      locations = [],
      employeeRanges = [],
      page = 1,
      perPage = 25,
    } = await req.json();

    const body: Record<string, unknown> = {
      page,
      per_page: perPage,
    };

    if (keywords.length > 0) body.q_organization_keyword_tags = keywords;
    if (personTitles.length > 0) body.person_titles = personTitles;
    if (locations.length > 0) body.person_locations = locations;
    if (employeeRanges.length > 0)
      body.organization_num_employees_ranges = employeeRanges;

    const res = await fetch("https://api.apollo.io/v1/mixed_people/api_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Apollo API error: ${res.status} ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const totalEntries = data.total_entries || 0;
    const totalPages = Math.ceil(totalEntries / perPage);
    return NextResponse.json({
      people: data.people || [],
      pagination: {
        total_entries: totalEntries,
        total_pages: totalPages,
        page,
        per_page: perPage,
      },
    });
  } catch (error) {
    console.error("Apollo search error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
