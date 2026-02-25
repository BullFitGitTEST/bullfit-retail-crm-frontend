"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getAccount,
  updateAccount,
  createLocation,
  createRetailContact,
  createOpportunity,
  deleteLocation,
  deleteRetailContact,
  OPPORTUNITY_STAGES,
} from "@/lib/api";
import type {
  Account,
  Location,
  RetailContact,
  Opportunity,
  LocationInput,
  RetailContactInput,
  OpportunityInput,
  OpportunityStage,
} from "@/lib/api";

type TabId = "overview" | "locations" | "contacts" | "opportunities" | "edit";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

export default function AccountDetailPage() {
  const { id } = useParams();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const fetchAccount = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getAccount(id as string);
      setAccount(data);
    } catch (err) {
      console.error("Failed to load account", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading account...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Account not found</div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "locations", label: "Locations", count: account.locations?.length },
    { id: "contacts", label: "Contacts", count: account.contacts?.length },
    {
      id: "opportunities",
      label: "Opportunities",
      count: account.opportunities?.length,
    },
    { id: "edit", label: "Edit" },
  ];

  return (
    <div>
      <Link
        href="/accounts"
        className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
      >
        &larr; Back to Accounts
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{account.name}</h1>
        <div className="mt-1 flex items-center gap-4">
          {account.industry && (
            <span className="text-sm text-slate-400 capitalize">
              {account.industry.replace("_", " ")}
            </span>
          )}
          {account.website && (
            <a
              href={
                account.website.startsWith("http")
                  ? account.website
                  : `https://${account.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              {account.website}
            </a>
          )}
          {account.owner_name && (
            <span className="text-sm text-slate-500">
              Owner: {account.owner_name}
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Locations</p>
          <p className="text-2xl font-bold text-white">
            {account.locations?.length || 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Contacts</p>
          <p className="text-2xl font-bold text-white">
            {account.contacts?.length || 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">
            Active Opps
          </p>
          <p className="text-2xl font-bold text-indigo-400">
            {account.opportunities?.filter((o) => o.stage !== "closed_lost")
              .length || 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">
            Pipeline Value
          </p>
          <p className="text-2xl font-bold text-emerald-400">
            $
            {(
              account.opportunities
                ?.filter((o) => o.stage !== "closed_lost")
                .reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
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
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-slate-500">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab account={account} />
      )}
      {activeTab === "locations" && (
        <LocationsTab account={account} onRefresh={fetchAccount} />
      )}
      {activeTab === "contacts" && (
        <ContactsTab account={account} onRefresh={fetchAccount} />
      )}
      {activeTab === "opportunities" && (
        <OpportunitiesTab account={account} onRefresh={fetchAccount} />
      )}
      {activeTab === "edit" && (
        <EditAccountTab account={account} onSaved={setAccount} />
      )}
    </div>
  );
}

// === OVERVIEW TAB ===
function OverviewTab({ account }: { account: Account }) {
  const recentOpps = account.opportunities?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {account.notes && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Notes</h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">
            {account.notes}
          </p>
        </div>
      )}

      {/* Recent Opportunities */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          Recent Opportunities
        </h3>
        {recentOpps.length === 0 ? (
          <p className="text-sm text-slate-500">No opportunities yet.</p>
        ) : (
          <div className="space-y-2">
            {recentOpps.map((o) => (
              <Link
                key={o.id}
                href={`/opportunities/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600 transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{o.title}</p>
                  <p className="text-xs text-slate-500">
                    {o.location_name && `${o.location_name} \u2022 `}
                    {stageLabelMap[o.stage] || o.stage}
                  </p>
                </div>
                {o.estimated_value && (
                  <span className="text-sm font-medium text-emerald-400">
                    ${o.estimated_value.toLocaleString()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Key Contacts */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          Key Contacts
        </h3>
        {(account.contacts?.length || 0) === 0 ? (
          <p className="text-sm text-slate-500">No contacts yet.</p>
        ) : (
          <div className="space-y-2">
            {account.contacts
              ?.filter((c) => c.is_primary || c.is_decision_maker)
              .slice(0, 5)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
                >
                  <div>
                    <p className="text-sm text-white">
                      {c.first_name} {c.last_name}
                      {c.is_primary && (
                        <span className="ml-2 text-xs text-indigo-400">
                          Primary
                        </span>
                      )}
                      {c.is_decision_maker && (
                        <span className="ml-2 text-xs text-amber-400">
                          Decision Maker
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.title || c.role} {c.location_name && `\u2022 ${c.location_name}`}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {c.email && <p>{c.email}</p>}
                    {c.phone && <p>{c.phone}</p>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === LOCATIONS TAB ===
function LocationsTab({
  account,
  onRefresh,
}: {
  account: Account;
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<LocationInput>>({
    account_id: account.id,
    name: "",
    store_type: "other",
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      await createLocation({ ...form, account_id: account.id } as LocationInput);
      setShowAdd(false);
      setForm({ account_id: account.id, name: "", store_type: "other" });
      onRefresh();
    } catch (err) {
      console.error("Failed to create location", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this location?")) return;
    try {
      await deleteLocation(id);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete location", err);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Location
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Name *
              </label>
              <input
                required
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Store #123 - Downtown"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Store Type
              </label>
              <select
                value={form.store_type || "other"}
                onChange={(e) => setForm({ ...form, store_type: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="pharmacy">Pharmacy</option>
                <option value="health_food">Health Food</option>
                <option value="gym">Gym</option>
                <option value="supplement">Supplement</option>
                <option value="grocery">Grocery</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Address
              </label>
              <input
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">City</label>
              <input
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                State
              </label>
              <input
                value={form.state || ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
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
              {saving ? "Adding..." : "Add Location"}
            </button>
          </div>
        </form>
      )}

      {(account.locations?.length || 0) === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No locations yet. Add your first store door.
        </p>
      ) : (
        <div className="space-y-2">
          {account.locations?.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">{loc.name}</p>
                <p className="text-xs text-slate-400">
                  {[loc.address, loc.city, loc.state].filter(Boolean).join(", ") || "No address"}
                  {" \u2022 "}
                  <span className="capitalize">
                    {loc.store_type?.replace("_", " ")}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {loc.phone && (
                  <span className="text-xs text-slate-400">{loc.phone}</span>
                )}
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === CONTACTS TAB ===
function ContactsTab({
  account,
  onRefresh,
}: {
  account: Account;
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<RetailContactInput>>({
    account_id: account.id,
    first_name: "",
    role: "other",
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name?.trim()) return;
    setSaving(true);
    try {
      await createRetailContact({
        ...form,
        account_id: account.id,
      } as RetailContactInput);
      setShowAdd(false);
      setForm({ account_id: account.id, first_name: "", role: "other" });
      onRefresh();
    } catch (err) {
      console.error("Failed to create contact", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    try {
      await deleteRetailContact(id);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete contact", err);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Contact
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                First Name *
              </label>
              <input
                required
                value={form.first_name || ""}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Last Name
              </label>
              <input
                value={form.last_name || ""}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Role</label>
              <select
                value={form.role || "other"}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="buyer">Buyer</option>
                <option value="store_manager">Store Manager</option>
                <option value="owner">Owner</option>
                <option value="regional_manager">Regional Manager</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Title
              </label>
              <input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Director of Purchasing"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          {(account.locations?.length || 0) > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Location
              </label>
              <select
                value={form.location_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location_id: e.target.value || undefined,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">All locations</option>
                {account.locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.is_primary || false}
                onChange={(e) =>
                  setForm({ ...form, is_primary: e.target.checked })
                }
                className="rounded border-slate-600"
              />
              Primary Contact
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.is_decision_maker || false}
                onChange={(e) =>
                  setForm({ ...form, is_decision_maker: e.target.checked })
                }
                className="rounded border-slate-600"
              />
              Decision Maker
            </label>
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
              {saving ? "Adding..." : "Add Contact"}
            </button>
          </div>
        </form>
      )}

      {(account.contacts?.length || 0) === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No contacts yet. Add people at this account.
        </p>
      ) : (
        <div className="space-y-2">
          {account.contacts?.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {c.first_name} {c.last_name}
                  {c.is_primary && (
                    <span className="ml-2 rounded bg-indigo-600/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                      PRIMARY
                    </span>
                  )}
                  {c.is_decision_maker && (
                    <span className="ml-2 rounded bg-amber-600/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                      DECISION MAKER
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {c.title || c.role.replace("_", " ")}
                  {c.location_name && ` \u2022 ${c.location_name}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-slate-400">
                  {c.email && <p>{c.email}</p>}
                  {c.phone && <p>{c.phone}</p>}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === OPPORTUNITIES TAB ===
function OpportunitiesTab({
  account,
  onRefresh,
}: {
  account: Account;
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<OpportunityInput>>({
    account_id: account.id,
    title: "",
    stage: "targeted",
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createOpportunity({
        ...form,
        account_id: account.id,
        title:
          form.title ||
          `${account.name} - New Opportunity`,
      } as OpportunityInput);
      setShowAdd(false);
      setForm({ account_id: account.id, title: "", stage: "targeted" });
      onRefresh();
    } catch (err) {
      console.error("Failed to create opportunity", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + New Opportunity
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Title
              </label>
              <input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`${account.name} - BullFit Launch`}
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Stage
              </label>
              <select
                value={form.stage || "targeted"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stage: e.target.value as OpportunityStage,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {OPPORTUNITY_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(account.locations?.length || 0) > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Location
                </label>
                <select
                  value={form.location_id || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location_id: e.target.value || undefined,
                    })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select location...</option>
                  {account.locations?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Est. Value ($)
              </label>
              <input
                type="number"
                value={form.estimated_value || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_value: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
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
              {saving ? "Creating..." : "Create Opportunity"}
            </button>
          </div>
        </form>
      )}

      {(account.opportunities?.length || 0) === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No opportunities yet. Create one to start the pipeline.
        </p>
      ) : (
        <div className="space-y-2">
          {account.opportunities?.map((o) => (
            <Link
              key={o.id}
              href={`/opportunities/${o.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 hover:border-slate-600 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{o.title}</p>
                <p className="text-xs text-slate-400">
                  {o.location_name && `${o.location_name} \u2022 `}
                  {o.contact_first_name &&
                    `${o.contact_first_name} ${o.contact_last_name || ""} \u2022 `}
                  <span
                    className={
                      o.stage === "closed_lost"
                        ? "text-red-400"
                        : "text-indigo-300"
                    }
                  >
                    {stageLabelMap[o.stage] || o.stage}
                  </span>
                  {" \u2022 "}
                  {o.probability}% probability
                </p>
              </div>
              <div className="text-right">
                {o.estimated_value && (
                  <p className="text-sm font-medium text-emerald-400">
                    ${o.estimated_value.toLocaleString()}
                  </p>
                )}
                {o.next_step_date && (
                  <p className="text-xs text-slate-500">
                    Next: {new Date(o.next_step_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// === EDIT TAB ===
function EditAccountTab({
  account,
  onSaved,
}: {
  account: Account;
  onSaved: (a: Account) => void;
}) {
  const [form, setForm] = useState({
    name: account.name,
    website: account.website || "",
    industry: account.industry || "",
    annual_revenue: account.annual_revenue || "",
    employee_count: account.employee_count || "",
    notes: account.notes || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateAccount(account.id, {
        ...form,
        annual_revenue: form.annual_revenue
          ? Number(form.annual_revenue)
          : undefined,
        employee_count: form.employee_count
          ? Number(form.employee_count)
          : undefined,
      });
      onSaved(updated);
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
          Account Name *
        </label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Website
          </label>
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Industry
          </label>
          <select
            value={form.industry}
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Annual Revenue ($)
          </label>
          <input
            type="number"
            value={form.annual_revenue}
            onChange={(e) =>
              setForm({ ...form, annual_revenue: e.target.value })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Employee Count
          </label>
          <input
            type="number"
            value={form.employee_count}
            onChange={(e) =>
              setForm({ ...form, employee_count: e.target.value })
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
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
