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
  addOpportunityActivity,
  OPPORTUNITY_STAGES,
} from "@/lib/api";
import type {
  Opportunity,
  OpportunityProduct,
  OpportunityActivity,
  OpportunityStage,
} from "@/lib/api";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

type TabId = "activity" | "products" | "details" | "edit";

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
    try {
      const updated = await moveOpportunityStage(
        opp.id,
        newStage as OpportunityStage
      );
      setOpp((prev) => (prev ? { ...prev, ...updated } : prev));
      fetchOpp(); // refresh activities
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

  return (
    <div>
      <Link
        href={`/accounts/${opp.account_id}`}
        className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
      >
        &larr; Back to {opp.account_name}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{opp.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
            <span>{opp.account_name}</span>
            {opp.location_name && (
              <>
                <span className="text-slate-600">\u2022</span>
                <span>{opp.location_name}</span>
              </>
            )}
            {opp.contact_first_name && (
              <>
                <span className="text-slate-600">\u2022</span>
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
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Next Step</p>
          {opp.next_step_date ? (
            <>
              <p className="text-sm text-white">
                {new Date(opp.next_step_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {opp.next_step_description || "No description"}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Not set</p>
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
        <div className="flex gap-6">
          {(
            [
              { id: "activity" as const, label: "Activity" },
              {
                id: "products" as const,
                label: `Products (${opp.products?.length || 0})`,
              },
              { id: "details" as const, label: "Details" },
              { id: "edit" as const, label: "Edit" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors ${
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
      {activeTab === "details" && <DetailsTab opp={opp} />}
      {activeTab === "edit" && <EditTab opp={opp} onSaved={fetchOpp} />}
    </div>
  );
}

// === ACTIVITY TAB ===
function ActivityTab({
  opp,
  onRefresh,
}: {
  opp: Opportunity;
  onRefresh: () => void;
}) {
  const [noteText, setNoteText] = useState("");

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

  const typeIcons: Record<string, { bg: string; letter: string }> = {
    stage_change: { bg: "bg-purple-600/20 text-purple-400", letter: "S" },
    note: { bg: "bg-blue-600/20 text-blue-400", letter: "N" },
    call: { bg: "bg-indigo-600/20 text-indigo-400", letter: "C" },
    email: { bg: "bg-yellow-600/20 text-yellow-400", letter: "E" },
    meeting: { bg: "bg-teal-600/20 text-teal-400", letter: "M" },
    product_added: { bg: "bg-emerald-600/20 text-emerald-400", letter: "P" },
    opportunity_created: { bg: "bg-green-600/20 text-green-400", letter: "+" },
  };

  return (
    <div>
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
          <div className="grid grid-cols-4 gap-3">
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
                <label className="block text-xs text-slate-400 mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  $/unit
                </label>
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
                    {p.total_price ? `$${p.total_price.toLocaleString()}` : "\u2014"}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// === DETAILS TAB ===
function DetailsTab({ opp }: { opp: Opportunity }) {
  const details = [
    { label: "Account", value: opp.account_name },
    { label: "Location", value: opp.location_name || "Not assigned" },
    { label: "Store Type", value: opp.store_type?.replace("_", " ") || "\u2014" },
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
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-2 gap-4">
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
