"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProspect,
  updateProspect,
  getActivitiesByProspect,
  createActivity,
  getTasks,
  createTask,
  completeTask,
  getCalls,
  initiateCall,
  updateProspectStage,
} from "@/lib/api";
import type { Prospect, Activity, Task, Call } from "@/lib/api";
import StageBadge from "@/components/shared/StageBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";

export default function ProspectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "tasks" | "calls" | "edit">("activity");
  const [noteText, setNoteText] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [p, acts, t, c] = await Promise.all([
        getProspect(id as string),
        getActivitiesByProspect(id as string),
        getTasks({ prospect_id: id as string }),
        getCalls({ prospect_id: id as string }),
      ]);
      setProspect(p);
      setActivities(acts);
      setTasks(t);
      setCalls(c);
    } catch (err) {
      console.error("Failed to load prospect", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStageChange(newStage: string) {
    if (!prospect) return;
    try {
      const updated = await updateProspectStage(prospect.id, newStage);
      setProspect(updated);
      const acts = await getActivitiesByProspect(prospect.id);
      setActivities(acts);
    } catch (err) {
      console.error("Failed to update stage", err);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim() || !prospect) return;
    try {
      await createActivity({
        prospect_id: prospect.id,
        type: "note",
        title: "Note added",
        description: noteText.trim(),
      });
      setNoteText("");
      const acts = await getActivitiesByProspect(prospect.id);
      setActivities(acts);
    } catch (err) {
      console.error("Failed to add note", err);
    }
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim() || !prospect) return;
    try {
      await createTask({
        prospect_id: prospect.id,
        title: newTaskTitle.trim(),
      });
      setNewTaskTitle("");
      const t = await getTasks({ prospect_id: prospect.id });
      setTasks(t);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await completeTask(taskId);
      if (prospect) {
        const [t, acts] = await Promise.all([
          getTasks({ prospect_id: prospect.id }),
          getActivitiesByProspect(prospect.id),
        ]);
        setTasks(t);
        setActivities(acts);
      }
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  }

  async function handleCall() {
    if (!prospect?.phone) {
      alert("This prospect has no phone number");
      return;
    }
    try {
      await initiateCall({ prospect_id: prospect.id });
      const [c, acts] = await Promise.all([
        getCalls({ prospect_id: prospect.id }),
        getActivitiesByProspect(prospect.id),
      ]);
      setCalls(c);
      setActivities(acts);
    } catch (err) {
      console.error("Failed to initiate call", err);
      alert("Failed to initiate call. Make sure Bland.ai is configured.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading prospect...</div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Prospect not found</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Back link */}
      <Link href="/prospects" className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block">
        &larr; Back to Prospects
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{prospect.business_name}</h1>
          <div className="mt-1 flex items-center gap-3">
            {(prospect.contact_first_name || prospect.contact_last_name) && (
              <span className="text-sm text-slate-400">
                {prospect.contact_first_name} {prospect.contact_last_name}
              </span>
            )}
            {prospect.city && prospect.state && (
              <span className="text-sm text-slate-500">{prospect.city}, {prospect.state}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {prospect.phone && (
            <button
              onClick={handleCall}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              Call
            </button>
          )}
          <select
            value={prospect.pipeline_stage}
            onChange={(e) => handleStageChange(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="partner">Partner</option>
          </select>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Stage</p>
          <StageBadge stage={prospect.pipeline_stage} />
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Contact</p>
          <p className="text-sm text-white">{prospect.email || "No email"}</p>
          <p className="text-sm text-slate-400">{prospect.phone || "No phone"}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Store Type</p>
          <p className="text-sm text-white capitalize">{prospect.store_type?.replace("_", " ") || "Other"}</p>
          {prospect.estimated_monthly_volume && (
            <p className="text-sm text-slate-400">${prospect.estimated_monthly_volume}/mo est.</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <div className="flex gap-6">
          {(["activity", "tasks", "calls", "edit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab} {tab === "tasks" ? `(${tasks.filter((t) => t.status === "pending").length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "activity" && (
        <div>
          {/* Add note */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Add Note
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                  <div className="mt-0.5">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        a.type === "call"
                          ? "bg-indigo-600/20 text-indigo-400"
                          : a.type === "note"
                          ? "bg-blue-600/20 text-blue-400"
                          : a.type === "stage_change"
                          ? "bg-purple-600/20 text-purple-400"
                          : a.type === "task_completed"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-yellow-600/20 text-yellow-400"
                      }`}
                    >
                      {a.type[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{a.title}</p>
                    {a.description && <p className="text-sm text-slate-400 mt-1">{a.description}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div>
          {/* Add task */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Add Task
            </button>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks yet.</p>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 ${
                    t.status === "completed" ? "opacity-50" : ""
                  }`}
                >
                  <button
                    onClick={() => t.status !== "completed" && handleCompleteTask(t.id)}
                    className={`h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center ${
                      t.status === "completed"
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-slate-600 hover:border-indigo-500"
                    }`}
                  >
                    {t.status === "completed" && "✓"}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${t.status === "completed" ? "line-through text-slate-500" : "text-white"}`}>
                      {t.title}
                    </p>
                    {t.due_date && (
                      <p className="text-xs text-slate-500">
                        Due: {new Date(t.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "calls" && (
        <div className="space-y-3">
          {calls.length === 0 ? (
            <p className="text-sm text-slate-500">No calls yet. Click &quot;Call&quot; to get started.</p>
          ) : (
            calls.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white capitalize">{c.direction} Call</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === "completed" ? "bg-green-600/20 text-green-400" :
                    c.status === "in_progress" ? "bg-yellow-600/20 text-yellow-400" :
                    c.status === "failed" ? "bg-red-600/20 text-red-400" :
                    "bg-slate-600/20 text-slate-400"
                  }`}>
                    {c.status}
                  </span>
                </div>
                {c.summary && <p className="text-sm text-slate-300 mb-2">{c.summary}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {c.duration_seconds && <span>{Math.round(c.duration_seconds)}s</span>}
                  {c.outcome && <span className="capitalize">{c.outcome.replace("_", " ")}</span>}
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "edit" && (
        <EditProspectForm
          prospect={prospect}
          onSaved={(p) => setProspect(p)}
        />
      )}
    </div>
  );
}

function EditProspectForm({
  prospect,
  onSaved,
}: {
  prospect: Prospect;
  onSaved: (p: Prospect) => void;
}) {
  const [form, setForm] = useState({
    business_name: prospect.business_name,
    contact_first_name: prospect.contact_first_name || "",
    contact_last_name: prospect.contact_last_name || "",
    email: prospect.email || "",
    phone: prospect.phone || "",
    website: prospect.website || "",
    address: prospect.address || "",
    city: prospect.city || "",
    state: prospect.state || "",
    zip: prospect.zip || "",
    store_type: prospect.store_type || "other",
    notes: prospect.notes || "",
    estimated_monthly_volume: prospect.estimated_monthly_volume || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProspect(prospect.id, {
        ...form,
        estimated_monthly_volume: form.estimated_monthly_volume ? Number(form.estimated_monthly_volume) : undefined,
      });
      onSaved(updated);
    } catch (err) {
      console.error("Failed to update", err);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "business_name", label: "Business Name", required: true },
    { key: "contact_first_name", label: "First Name" },
    { key: "contact_last_name", label: "Last Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "website", label: "Website" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip", label: "ZIP" },
    { key: "estimated_monthly_volume", label: "Est. Monthly Volume ($)", type: "number" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.key === "address" ? "col-span-2" : ""}>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {f.label} {f.required && "*"}
            </label>
            <input
              type={f.type || "text"}
              required={f.required}
              value={(form as any)[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
