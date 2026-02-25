"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProspects, createProspect, deleteProspect } from "@/lib/api";
import type { Prospect, ProspectInput } from "@/lib/api";
import StageBadge from "@/components/shared/StageBadge";
import ApolloSearch from "@/components/ApolloSearch";

export default function ProspectsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-12 text-center">Loading...</div>}>
      <ProspectsContent />
    </Suspense>
  );
}

function ProspectsContent() {
  const searchParams = useSearchParams();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showApolloSearch, setShowApolloSearch] = useState(false);

  const fetchProspects = useCallback(async () => {
    try {
      const data = await getProspects({
        search: search || undefined,
        stage: stageFilter || undefined,
      });
      setProspects(data);
    } catch (err) {
      console.error("Failed to fetch prospects", err);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProspects(), 300);
    return () => clearTimeout(timer);
  }, [fetchProspects]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this prospect?")) return;
    try {
      await deleteProspect(id);
      setProspects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospects</h1>
          <p className="mt-1 text-sm text-slate-400">{prospects.length} total prospects</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApolloSearch(true)}
            className="rounded-lg border border-indigo-500/30 bg-slate-800 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-600/10 transition"
          >
            Find with Apollo
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + Add Prospect
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search prospects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Stages</option>
          <option value="lead">Lead</option>
          <option value="contacted">Contacted</option>
          <option value="interested">Interested</option>
          <option value="partner">Partner</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : prospects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No prospects found.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Add your first prospect
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Phone</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {prospects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="text-sm font-medium text-white hover:text-indigo-400"
                    >
                      {p.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {p.contact_first_name} {p.contact_last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {p.city && p.state ? `${p.city}, ${p.state}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 capitalize">
                    {p.store_type?.replace("_", " ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={p.pipeline_stage} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {p.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddProspectModal
          onClose={() => setShowAddModal(false)}
          onAdded={(p) => {
            setProspects((prev) => [p, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Apollo Search Modal */}
      {showApolloSearch && (
        <ApolloSearch
          onClose={() => setShowApolloSearch(false)}
          onImported={(newProspects) => {
            setProspects((prev) => [...newProspects, ...prev]);
          }}
        />
      )}
    </div>
  );
}

function AddProspectModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (p: Prospect) => void;
}) {
  const [form, setForm] = useState<ProspectInput>({
    business_name: "",
    contact_first_name: "",
    contact_last_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    store_type: "other",
    source: "manual",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name.trim()) return;
    setSaving(true);
    try {
      const prospect = await createProspect(form);
      onAdded(prospect);
    } catch (err) {
      console.error("Failed to create prospect", err);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Add Prospect</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={form.contact_first_name || ""}
                onChange={(e) => setForm({ ...form, contact_first_name: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={form.contact_last_name || ""}
                onChange={(e) => setForm({ ...form, contact_last_name: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={form.state || ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Store Type</label>
            <select
              value={form.store_type || "other"}
              onChange={(e) => setForm({ ...form, store_type: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="pharmacy">Pharmacy</option>
              <option value="health_food">Health Food</option>
              <option value="gym">Gym</option>
              <option value="supplement">Supplement Store</option>
              <option value="grocery">Grocery</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Prospect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
