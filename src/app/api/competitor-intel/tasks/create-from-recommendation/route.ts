import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/lib/api";
import type { RecommendationItem } from "@/lib/competitor-intel/types";

// POST /api/competitor-intel/tasks/create-from-recommendation
// Creates a CRM task from a recommendation action
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recommendation,
      competitor_name,
    }: {
      recommendation: RecommendationItem;
      competitor_name: string;
    } = body;

    if (!recommendation?.task_payload) {
      return NextResponse.json(
        { error: "recommendation with task_payload is required" },
        { status: 400 }
      );
    }

    const { task_payload } = recommendation;

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (task_payload.due_offset_days || 3));
    // Skip weekends
    const dayOfWeek = dueDate.getDay();
    if (dayOfWeek === 0) dueDate.setDate(dueDate.getDate() + 1);
    if (dayOfWeek === 6) dueDate.setDate(dueDate.getDate() + 2);

    // Create task in CRM via existing API
    const task = await createTask({
      title: `[Competitor Intel] ${task_payload.title}`,
      description: [
        task_payload.description,
        "",
        `Competitor: ${competitor_name}`,
        `Action Type: ${recommendation.action_type}`,
        `Expected Impact: ${recommendation.expected_impact}`,
        "",
        "---",
        `Auto-generated from Competitor Intel recommendation.`,
        `Insight ID: ${task_payload.metadata.insight_id}`,
        `Citations: ${recommendation.citations
          .map((c) => `snapshot:${c.snapshot_id.slice(0, 8)}/${c.field_path}`)
          .join(", ")}`,
      ].join("\n"),
      priority:
        recommendation.expected_impact === "high"
          ? "high"
          : recommendation.expected_impact === "medium"
            ? "medium"
            : "low",
      due_date: dueDate.toISOString().split("T")[0],
    });

    return NextResponse.json(
      {
        task_id: task.id,
        title: task.title,
        due_date: task.due_date,
        message: "Task created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(
      "POST /api/competitor-intel/tasks/create-from-recommendation error:",
      err
    );
    return NextResponse.json(
      { error: "Failed to create task from recommendation" },
      { status: 500 }
    );
  }
}
