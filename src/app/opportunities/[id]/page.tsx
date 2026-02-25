"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getOpportunity,
  updateOpportunity,
  moveOpportunityStage,
  addOpportunityProduct,
  updateProductStatus,
  removeOpportunityProduct,
  addOpportunityActivity,
  addOpportunityDocument,
  updateOpportunityDocument,
  removeOpportunityDocument,
  OPPORTUNITY_STAGES,
  STAGE_CHECKLISTS,
} from "@/lib/api";
import type {
  Opportunity,
  OpportunityProduct,
  OpportunityActivity,
  OpportunityStage,
  Document,
} from "@/lib/api";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

type TabId = "activity" | "products" | "documents" | "checklist" | "details" | "edit";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("activity");

  const fetchOpp = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOpportunity(id as string);
      setOpp(data);
    } catch (err) {
      console.error("Failed to load opportunity", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOpp();
  }, [fetchOpp]);

  async function handleStageChange(newStage: string) {
    if (!opp) return;
    if (newStage === "closed_lost") {
      const reason = prompt("Why was this deal lost?");
      if (reason === null) return; // cancelled
      try {
        const updated = await moveOpportunityStage(
          opp.id,
          newStage as OpportunityStage,
          reason || undefined
        );
        setOpp((prev) => (prev ? { ...prev, ...updated } : prev));
        fetchOpp();
      } catch (err) {
        console.error("Failed to update stage", err);
      }
      return;
    }
    try {
      const updated = await moveOpportunityStage(
        opp.id,
        newStage as OpportunityStage
      );
      setOpp((prev) => (prev ? { ...prev, ...updated } : prev));
      fetchOpp();
    } catch (err) {
      console.error("Failed to update stage", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading opportunity...</div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Opportunity not found</div>
      </div>
    );
  }

  const isOverdue =
    opp.next_step_date && new Date(opp.next_step_date) < new Date();
  const daysOverdue = isOverdue
    ? Math.floor(
        (new Date().getTime() - new Date(opp.next_step_date!).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div>
      <Link
        href={`/accounts/${opp.account_id}`}
        className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
      >
        &larr; Back to {opp.account_name}
      </Link>

      {/* Overdue Banner */}
      {isOverdue && opp.stage !== "closed_lost" && opp.stage !== "on_shelf" && opp.stage !== "reorder_cycle" && (
        <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/20 px-3 sm:px-4 py-3 flex items-start sm:items-center gap-3">
          <span className="text-red-400 text-lg">&#9888;</span>
          <div>
            <p className="text-sm font-medium text-red-300">
              Next step is {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
            </p>
            <p className="text-xs text-red-400/80">
              {opp.next_step_description || "No description"} &mdash; was due{" "}
              {new Date(opp.next_step_date!).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{opp.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
            <span>{opp.account_name}</span>
            {opp.location_name && (
              <>
                <span className="text-slate-600 hidden sm:inline">{"\u2022"}</span>
                <span>{opp.location_name}</span>
              </>
            )}
            {opp.contact_first_name && (
              <>
                <span className="text-slate-600 hidden sm:inline">{"\u2022"}</span>
                <span>
                  {opp.contact_first_name} {opp.contact_last_name}
                </span>
              </>
            )}
          </div>
        </div>
        <select
          value={opp.stage}
          onChange={(e) => handleStageChange(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none self-start flex-shrink-0"
        >
          {OPPORTUNITY_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} ({s.probability}%)
            </option>
          ))}
          <option value="closed_lost">Closed Lost (0%)</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {/* Stage Progress Bar */}
      <div className="mb-4 sm:mb-6 rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {OPPORTUNITY_STAGES.map((s, i) => {
            const currentIdx = OPPORTUNITY_STAGES.findIndex(
              (st) => st.id === opp.stage
            );
            const isPast = i < currentIdx;
            const isCurrent = s.id === opp.stage;
            return (
              <button
                key={s.id}
                onClick={() => handleStageChange(s.id)}
                className={`flex-shrink-0 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                  isCurrent
                    ? "bg-indigo-600 text-white"
                    : isPast
                    ? "bg-indigo-600/30 text-indigo-300"
                    : "bg-slate-700 text-slate-500 hover:bg-slate-600"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Stage</p>
          <p className="text-sm font-medium text-white">
            {stageLabelMap[opp.stage] || opp.stage}
          </p>
          <p className="text-xs text-slate-500">{opp.probability}% probability</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Est. Value</p>
          <p className="text-lg font-bold text-emerald-400">
            ${(opp.estimated_value || 0).toLocaleString()}
          </p>
          {opp.estimated_monthly_volume ? (
            <p className="text-xs text-slate-500">
              ${opp.estimated_monthly_volume.toLocaleString()}/mo
            </p>
          ) : null}
        </div>
        <div
          className={`rounded-xl border p-4 ${
            isOverdue
              ? "border-red-700/50 bg-red-900/10"
              : "border-slate-700 bg-slate-800"
          }`}
        >
          <p className="text-xs text-slate-400 uppercase mb-1">Next Step</p>
          {opp.next_step_date ? (
            <>
              <p
                className={`text-sm font-medium ${
                  isOverdue ? "text-red-400" : "text-white"
                }`}
              >
                {new Date(opp.next_step_date).toLocaleDateString()}
                {isOverdue && (
                  <span className="ml-2 text-xs">({daysOverdue}d overdue)</span>
                )}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {opp.next_step_description || "No description"}
              </p>
            </>
          ) : (
            <p className="text-sm text-yellow-400">Not set &#x26A0;</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Contact</p>
          {opp.contact_first_name ? (
            <>
              <p className="text-sm text-white">
                {opp.contact_first_name} {opp.contact_last_name}
              </p>
              <p className="text-xs text-slate-400">
                {opp.contact_email || opp.contact_phone || ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No contact</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <div className="flex gap-6 overflow-x-auto">
          {(
            [
              { id: "activity" as const, label: "Activity" },
              {
                id: "products" as const,
                label: `Products (${opp.products?.length || 0})`,
              },
              {
                id: "documents" as const,
                label: `Documents (${opp.documents?.length || 0})`,
              },
              { id: "checklist" as const, label: "Checklist" },
              { id: "details" as const, label: "Details" },
              { id: "edit" as const, label: "Edit" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "activity" && (
        <ActivityTab opp={opp} onRefresh={fetchOpp} />
      )}
      {activeTab === "products" && (
        <ProductsTab opp={opp} onRefresh={fetchOpp} />
      )}
      {activeTab === "documents" && (
        <DocumentsTab opp={opp} onRefresh={fetchOpp} />
      )}
      {activeTab === "checklist" && <ChecklistTab opp={opp} />}
      {activeTab === "details" && <DetailsTab opp={opp} />}
      {activeTab === "edit" && <EditTab opp={opp} onSaved={fetchOpp} />}
    </div>
  );
}

// === ACTIVITY TAB (enhanced with structured types) ===
function ActivityTab({
  opp,
  onRefresh,
}: {
  opp: Opportunity;
  onRefresh: () => void;
}) {
  const [activityType, setActivityType] = useState<string>("note");
  const [noteText, setNoteText] = useState("");
  const [callData, setCallData] = useState({
    direction: "outbound",
    duration: "",
    outcome: "connected",
    notes: "",
  });
  const [emailData, setEmailData] = useState({
    subject: "",
    notes: "",
  });
  const [meetingData, setMeetingData] = useState({
    subject: "",
    duration: "",
    notes: "",
  });

  async function handleAddNote() {
    if (!noteText.trim()) return;
    try {
      await addOpportunityActivity(opp.id, {
        type: "note",
        title: "Note added",
        description: noteText.trim(),
      });
      setNoteText("");
      onRefresh();
    } catch (err) {
      console.error("Failed to add note", err);
    }
  }

  async function handleLogCall() {
    try {
      await addOpportunityActivity(opp.id, {
        type: "call",
        title: `${callData.direction === "outbound" ? "Outbound" : "Inbound"} call — ${callData.outcome}`,
        description: callData.notes || undefined,
        metadata: {
          direction: callData.direction,
          duration_minutes: callData.duration ? Number(callData.duration) : null,
          outcome: callData.outcome,
        },
      });
      setCallData({ direction: "outbound", duration: "", outcome: "connected", notes: "" });
      setActivityType("note");
      onRefresh();
    } catch (err) {
      console.error("Failed to log call", err);
    }
  }

  async function handleLogEmail() {
    if (!emailData.subject.trim()) return;
    try {
      await addOpportunityActivity(opp.id, {
        type: "email",
        title: `Email: ${emailData.subject}`,
        description: emailData.notes || undefined,
        metadata: { subject: emailData.subject },
      });
      setEmailData({ subject: "", notes: "" });
      setActivityType("note");
      onRefresh();
    } catch (err) {
      console.error("Failed to log email", err);
    }
  }

  async function handleLogMeeting() {
    if (!meetingData.subject.trim()) return;
    try {
      await addOpportunityActivity(opp.id, {
        type: "meeting",
        title: `Meeting: ${meetingData.subject}`,
        description: meetingData.notes || undefined,
        metadata: {
          subject: meetingData.subject,
          duration_minutes: meetingData.duration ? Number(meetingData.duration) : null,
        },
      });
      setMeetingData({ subject: "", duration: "", notes: "" });
      setActivityType("note");
      onRefresh();
    } catch (err) {
      console.error("Failed to log meeting", err);
    }
  }

  const typeIcons: Record<string, { bg: string; letter: string }> = {
    stage_change: { bg: "bg-purple-600/20 text-purple-400", letter: "S" },
    note: { bg: "bg-blue-600/20 text-blue-400", letter: "N" },
    call: { bg: "bg-indigo-600/20 text-indigo-400", letter: "C" },
    email: { bg: "bg-yellow-600/20 text-yellow-400", letter: "E" },
    meeting: { bg: "bg-teal-600/20 text-teal-400", letter: "M" },
    product_added: { bg: "bg-emerald-600/20 text-emerald-400", letter: "P" },
    document_added: { bg: "bg-orange-600/20 text-orange-400", letter: "D" },
    opportunity_created: { bg: "bg-green-600/20 text-green-400", letter: "+" },
  };

  return (
    <div>
      {/* Activity Type Selector */}
      <div className="mb-4 flex gap-2">
        {[
          { id: "note", label: "Note", icon: "N" },
          { id: "call", label: "Call", icon: "C" },
          { id: "email", label: "Email", icon: "E" },
          { id: "meeting", label: "Meeting", icon: "M" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActivityType(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activityType === t.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Note form */}
      {activityType === "note" && (
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
      )}

      {/* Call form */}
      {activityType === "call" && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Direction</label>
              <select
                value={callData.direction}
                onChange={(e) => setCallData({ ...callData, direction: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Duration (min)</label>
              <input
                type="number"
                value={callData.duration}
                onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
                placeholder="5"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Outcome</label>
              <select
                value={callData.outcome}
                onChange={(e) => setCallData({ ...callData, outcome: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="connected">Connected</option>
                <option value="voicemail">Voicemail</option>
                <option value="no_answer">No Answer</option>
                <option value="callback">Callback Requested</option>
                <option value="wrong_number">Wrong Number</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <input
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              placeholder="Call notes..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleLogCall}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Log Call
            </button>
          </div>
        </div>
      )}

      {/* Email form */}
      {activityType === "email" && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Subject</label>
            <input
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Email subject..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes / Summary</label>
            <textarea
              value={emailData.notes}
              onChange={(e) => setEmailData({ ...emailData, notes: e.target.value })}
              rows={2}
              placeholder="Key points from the email..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleLogEmail}
              disabled={!emailData.subject.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Log Email
            </button>
          </div>
        </div>
      )}

      {/* Meeting form */}
      {activityType === "meeting" && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Meeting Subject</label>
              <input
                value={meetingData.subject}
                onChange={(e) => setMeetingData({ ...meetingData, subject: e.target.value })}
                placeholder="Product pitch meeting..."
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Duration (min)</label>
              <input
                type="number"
                value={meetingData.duration}
                onChange={(e) => setMeetingData({ ...meetingData, duration: e.target.value })}
                placeholder="30"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes / Outcomes</label>
            <textarea
              value={meetingData.notes}
              onChange={(e) => setMeetingData({ ...meetingData, notes: e.target.value })}
              rows={2}
              placeholder="Meeting outcomes, action items..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleLogMeeting}
              disabled={!meetingData.subject.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Log Meeting
            </button>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="space-y-3">
        {(opp.activities?.length || 0) === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          opp.activities?.map((a) => {
            const icon = typeIcons[a.type] || {
              bg: "bg-slate-600/20 text-slate-400",
              letter: "?",
            };
            return (
              <div
                key={a.id}
                className="flex gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
              >
                <div className="mt-0.5">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${icon.bg}`}
                  >
                    {icon.letter}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{a.title}</p>
                  {a.description && (
                    <p className="text-sm text-slate-400 mt-1">
                      {a.description}
                    </p>
                  )}
                  {/* Show metadata for calls/meetings */}
                  {a.type === "call" && a.metadata && (
                    <div className="mt-1 flex gap-3 text-xs text-slate-500">
                      {a.metadata.duration_minutes && (
                        <span>{a.metadata.duration_minutes} min</span>
                      )}
                      {a.metadata.outcome && (
                        <span className="capitalize">{a.metadata.outcome}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// === PRODUCTS TAB ===
function ProductsTab({
  opp,
  onRefresh,
}: {
  opp: Opportunity;
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    sku: "",
    quantity: "",
    unit_price: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_name.trim()) return;
    setSaving(true);
    try {
      await addOpportunityProduct(opp.id, {
        product_name: form.product_name,
        sku: form.sku || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        unit_price: form.unit_price ? Number(form.unit_price) : undefined,
      });
      setShowAdd(false);
      setForm({ product_name: "", sku: "", quantity: "", unit_price: "" });
      onRefresh();
    } catch (err) {
      console.error("Failed to add product", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(productId: string, status: string) {
    try {
      await updateProductStatus(opp.id, productId, status);
      onRefresh();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function handleRemoveProduct(productId: string) {
    if (!confirm("Remove this product from the opportunity?")) return;
    try {
      await removeOpportunityProduct(opp.id, productId);
      onRefresh();
    } catch (err) {
      console.error("Failed to remove product", err);
    }
  }

  const statusColors: Record<string, string> = {
    pitched: "bg-blue-600/20 text-blue-300",
    sampled: "bg-yellow-600/20 text-yellow-300",
    approved: "bg-green-600/20 text-green-300",
    rejected: "bg-red-600/20 text-red-300",
    on_shelf: "bg-emerald-600/20 text-emerald-300",
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Product
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Product Name *
              </label>
              <input
                required
                value={form.product_name}
                onChange={(e) =>
                  setForm({ ...form, product_name: e.target.value })
                }
                placeholder="BullFit Whey Protein 5lb"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Qty</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">$/unit</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) =>
                    setForm({ ...form, unit_price: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      )}

      {(opp.products?.length || 0) === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No products pitched yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-400">
                  Product
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-400">
                  SKU
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-400">
                  Qty
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-400">
                  Unit Price
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-400">
                  Total
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium uppercase text-slate-400">
                  Status
                </th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {opp.products?.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm text-white">
                    {p.product_name}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-400">
                    {p.sku || "\u2014"}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-slate-300">
                    {p.quantity || "\u2014"}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-slate-300">
                    {p.unit_price ? `$${p.unit_price}` : "\u2014"}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-white">
                    {p.total_price
                      ? `$${p.total_price.toLocaleString()}`
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <select
                      value={p.status}
                      onChange={(e) =>
                        handleStatusChange(p.id, e.target.value)
                      }
                      className={`rounded px-2 py-0.5 text-xs font-medium border-0 ${
                        statusColors[p.status] || "bg-slate-600/20 text-slate-300"
                      }`}
                    >
                      <option value="pitched">Pitched</option>
                      <option value="sampled">Sampled</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="on_shelf">On Shelf</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRemoveProduct(p.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      &#10005;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// === DOCUMENTS TAB ===
function DocumentsTab({
  opp,
  onRefresh,
}: {
  opp: Opportunity;
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "vendor_form",
    url: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const docTypes = [
    { value: "vendor_form", label: "Vendor Form" },
    { value: "w9", label: "W-9" },
    { value: "insurance", label: "Insurance Certificate" },
    { value: "price_list", label: "Price List" },
    { value: "pitch_deck", label: "Pitch Deck" },
    { value: "purchase_order", label: "Purchase Order" },
    { value: "invoice", label: "Invoice" },
    { value: "contract", label: "Contract" },
    { value: "planogram", label: "Planogram" },
    { value: "other", label: "Other" },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-slate-600/20 text-slate-300",
    sent: "bg-blue-600/20 text-blue-300",
    received: "bg-yellow-600/20 text-yellow-300",
    approved: "bg-green-600/20 text-green-300",
    rejected: "bg-red-600/20 text-red-300",
    signed: "bg-emerald-600/20 text-emerald-300",
  };

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addOpportunityDocument(opp.id, {
        name: form.name,
        type: form.type,
        url: form.url || undefined,
        notes: form.notes || undefined,
      });
      setShowAdd(false);
      setForm({ name: "", type: "vendor_form", url: "", notes: "" });
      onRefresh();
    } catch (err) {
      console.error("Failed to add document", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(docId: string, status: string) {
    try {
      await updateOpportunityDocument(opp.id, docId, { status });
      onRefresh();
    } catch (err) {
      console.error("Failed to update document", err);
    }
  }

  async function handleRemove(docId: string) {
    if (!confirm("Remove this document?")) return;
    try {
      await removeOpportunityDocument(opp.id, docId);
      onRefresh();
    } catch (err) {
      console.error("Failed to remove document", err);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Document
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Document Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vendor Application Form"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {docTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">URL (optional)</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Document"}
            </button>
          </div>
        </form>
      )}

      {(opp.documents?.length || 0) === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No documents yet. Add vendor forms, W-9s, contracts, and more.
        </p>
      ) : (
        <div className="space-y-2">
          {opp.documents?.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/20 text-orange-400 text-xs font-medium">
                {doc.type === "vendor_form" ? "VF" : doc.type === "w9" ? "W9" : doc.type === "purchase_order" ? "PO" : doc.type === "invoice" ? "IN" : doc.type === "contract" ? "CT" : doc.type === "pitch_deck" ? "PD" : doc.type === "insurance" ? "IC" : doc.type === "price_list" ? "PL" : doc.type === "planogram" ? "PG" : "OT"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 truncate"
                    >
                      {doc.name}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-white truncate">
                      {doc.name}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 capitalize">
                    {doc.type.replace(/_/g, " ")}
                  </span>
                </div>
                {doc.notes && (
                  <p className="text-xs text-slate-500 truncate">{doc.notes}</p>
                )}
              </div>
              <select
                value={doc.status}
                onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                className={`rounded px-2 py-0.5 text-xs font-medium border-0 ${
                  statusColors[doc.status] || "bg-slate-600/20 text-slate-300"
                }`}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="signed">Signed</option>
              </select>
              <button
                onClick={() => handleRemove(doc.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === CHECKLIST TAB ===
function ChecklistTab({ opp }: { opp: Opportunity }) {
  // Store checklist state in localStorage keyed by opportunity id
  const storageKey = `opp_checklist_${opp.id}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  });

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const currentChecklist = STAGE_CHECKLISTS.find(
    (c) => c.stage === opp.stage
  );

  // Show current stage + completed stages checklists
  const currentStageIdx = OPPORTUNITY_STAGES.findIndex(
    (s) => s.id === opp.stage
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {STAGE_CHECKLISTS.filter((cl) => {
        const clIdx = OPPORTUNITY_STAGES.findIndex((s) => s.id === cl.stage);
        return clIdx <= currentStageIdx;
      }).map((cl) => {
        const isCurrent = cl.stage === opp.stage;
        const allDone = cl.items.every((item) => checked[`${cl.stage}_${item.key}`]);
        const requiredDone = cl.items
          .filter((i) => i.required)
          .every((item) => checked[`${cl.stage}_${item.key}`]);

        return (
          <div
            key={cl.stage}
            className={`rounded-xl border p-4 ${
              isCurrent
                ? "border-indigo-500/50 bg-slate-800"
                : allDone
                ? "border-emerald-700/50 bg-slate-800/50"
                : "border-slate-700 bg-slate-800/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {stageLabelMap[cl.stage]}
                </h3>
                {isCurrent && (
                  <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    CURRENT
                  </span>
                )}
              </div>
              {allDone ? (
                <span className="text-xs text-emerald-400">&#10003; Complete</span>
              ) : requiredDone ? (
                <span className="text-xs text-yellow-400">Required done</span>
              ) : (
                <span className="text-xs text-slate-500">
                  {cl.items.filter((i) => checked[`${cl.stage}_${i.key}`]).length}/{cl.items.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {cl.items.map((item) => {
                const key = `${cl.stage}_${item.key}`;
                const isChecked = !!checked[key];
                return (
                  <label
                    key={item.key}
                    className="flex items-start gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span
                      className={`text-sm ${
                        isChecked
                          ? "text-slate-500 line-through"
                          : "text-slate-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                      {item.required && !isChecked && (
                        <span className="ml-1 text-red-400 text-xs">*</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === DETAILS TAB ===
function DetailsTab({ opp }: { opp: Opportunity }) {
  const details = [
    { label: "Account", value: opp.account_name },
    { label: "Location", value: opp.location_name || "Not assigned" },
    {
      label: "Store Type",
      value: opp.store_type?.replace("_", " ") || "\u2014",
    },
    {
      label: "Contact",
      value: opp.contact_first_name
        ? `${opp.contact_first_name} ${opp.contact_last_name || ""}`
        : "Not assigned",
    },
    { label: "Contact Email", value: opp.contact_email || "\u2014" },
    { label: "Contact Phone", value: opp.contact_phone || "\u2014" },
    { label: "Owner", value: opp.owner_name || "Unassigned" },
    { label: "Source", value: opp.source },
    {
      label: "Est. Monthly Volume",
      value: opp.estimated_monthly_volume
        ? `$${opp.estimated_monthly_volume.toLocaleString()}/mo`
        : "\u2014",
    },
    {
      label: "Expected Close",
      value: opp.expected_close_date
        ? new Date(opp.expected_close_date).toLocaleDateString()
        : "\u2014",
    },
    {
      label: "Actual Close",
      value: opp.actual_close_date
        ? new Date(opp.actual_close_date).toLocaleDateString()
        : "\u2014",
    },
    {
      label: "Created",
      value: new Date(opp.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="space-y-3">
        {details.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2"
          >
            <span className="text-sm text-slate-400">{d.label}</span>
            <span className="text-sm text-white capitalize">{d.value}</span>
          </div>
        ))}
      </div>
      {opp.notes && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Notes</h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">
            {opp.notes}
          </p>
        </div>
      )}
      {opp.lost_reason && (
        <div className="mt-4 rounded-xl border border-red-700/50 bg-red-900/10 p-4">
          <h3 className="text-sm font-medium text-red-300 mb-2">Lost Reason</h3>
          <p className="text-sm text-red-400">{opp.lost_reason}</p>
        </div>
      )}
    </div>
  );
}

// === EDIT TAB ===
function EditTab({
  opp,
  onSaved,
}: {
  opp: Opportunity;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: opp.title,
    estimated_value: opp.estimated_value || "",
    estimated_monthly_volume: opp.estimated_monthly_volume || "",
    expected_close_date: opp.expected_close_date || "",
    next_step_date: opp.next_step_date || "",
    next_step_description: opp.next_step_description || "",
    notes: opp.notes || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOpportunity(opp.id, {
        title: form.title,
        estimated_value: form.estimated_value
          ? Number(form.estimated_value)
          : undefined,
        estimated_monthly_volume: form.estimated_monthly_volume
          ? Number(form.estimated_monthly_volume)
          : undefined,
        expected_close_date: form.expected_close_date || undefined,
        next_step_date: form.next_step_date || undefined,
        next_step_description: form.next_step_description || undefined,
        notes: form.notes || undefined,
      });
      onSaved();
    } catch (err) {
      console.error("Failed to update", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Estimated Value ($)
          </label>
          <input
            type="number"
            value={form.estimated_value}
            onChange={(e) =>
              setForm({ ...form, estimated_value: e.target.value })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Est. Monthly Volume ($)
          </label>
          <input
            type="number"
            value={form.estimated_monthly_volume}
            onChange={(e) =>
              setForm({ ...form, estimated_monthly_volume: e.target.value })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Expected Close Date
          </label>
          <input
            type="date"
            value={form.expected_close_date}
            onChange={(e) =>
              setForm({ ...form, expected_close_date: e.target.value })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Next Step Date
          </label>
          <input
            type="date"
            value={form.next_step_date}
            onChange={(e) =>
              setForm({ ...form, next_step_date: e.target.value })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Next Step Description
        </label>
        <input
          value={form.next_step_description}
          onChange={(e) =>
            setForm({ ...form, next_step_description: e.target.value })
          }
          placeholder="e.g. Send samples, follow up call, vendor form..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Notes
        </label>
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
