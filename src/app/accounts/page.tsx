"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAccounts, createAccount, deleteAccount } from "@/lib/api";
import type { Account, AccountInput } from "@/lib/api";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAccounts({ search: search || undefined });
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAccounts(), 300);
    return () => clearTimeout(timer);
  }, [fetchAccounts]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this account and all associated data?")) return;
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts</h1>
          <p className="mt-1 text-sm text-slate-400">
            {accounts.length} retail accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 self-start sm:self-auto"
        >
          + New Account
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No accounts found.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Create your first account
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-400">
                    Locations
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-400">
                    Contacts
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-400">
                    Opportunities
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {accounts.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="text-sm font-medium text-white hover:text-indigo-400"
                      >
                        {a.name}
                      </Link>
                      {a.website && (
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {a.website}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 capitalize">
                      {a.industry || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-700 px-2 text-xs font-medium text-slate-300">
                        {a.location_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-700 px-2 text-xs font-medium text-slate-300">
                        {a.contact_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600/20 px-2 text-xs font-medium text-indigo-300">
                        {a.active_opportunities || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {a.owner_name || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
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

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {accounts.map((a) => (
              <Link
                key={a.id}
                href={`/accounts/${a.id}`}
                className="block rounded-xl border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {a.name}
                    </p>
                    {a.industry && (
                      <p className="text-xs text-slate-400 capitalize mt-0.5">
                        {a.industry}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(a.id);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 ml-2 p-1"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1.5 text-[10px] font-medium text-slate-300">
                      {a.location_count || 0}
                    </span>
                    <span className="text-slate-500">locations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1.5 text-[10px] font-medium text-slate-300">
                      {a.contact_count || 0}
                    </span>
                    <span className="text-slate-500">contacts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600/20 px-1.5 text-[10px] font-medium text-indigo-300">
                      {a.active_opportunities || 0}
                    </span>
                    <span className="text-slate-500">opps</span>
                  </div>
                </div>
                {a.owner_name && (
                  <p className="mt-2 text-xs text-slate-500">
                    Owner: {a.owner_name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onAdded={(a) => {
            setAccounts((prev) => [a, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddAccountModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (a: Account) => void;
}) {
  const [form, setForm] = useState<AccountInput>({
    name: "",
    website: "",
    industry: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const account = await createAccount(form);
      onAdded(account);
    } catch (err) {
      console.error("Failed to create account", err);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg rounded-t-xl sm:rounded-xl border border-slate-700 bg-slate-800 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-4">
          New Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. GNC, CVS Health, Local Supplement Shop"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Website
              </label>
              <input
                type="text"
                value={form.website || ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Industry
              </label>
              <select
                value={form.industry || ""}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="supplement">Supplement Retail</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="health_food">Health Food</option>
                <option value="fitness">Fitness / Gym</option>
                <option value="grocery">Grocery</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="distributor">Distributor</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
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
              {saving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
