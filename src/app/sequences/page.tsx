"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSequences,
  getTemplates,
  createSequence,
  createTemplate,
  deleteSequence,
  deleteTemplate,
  OPPORTUNITY_STAGES,
} from "@/lib/api";
import type { Sequence, Template, SequenceInput, TemplateInput } from "@/lib/api";
import HelpPanel from "@/components/HelpPanel";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sequences" | "templates">("sequences");

  // Sequence form
  const [showNewSeq, setShowNewSeq] = useState(false);
  const [seqForm, setSeqForm] = useState<SequenceInput>({ name: "" });
  const [savingSeq, setSavingSeq] = useState(false);

  // Template form
  const [showNewTmpl, setShowNewTmpl] = useState(false);
  const [tmplForm, setTmplForm] = useState<TemplateInput>({ name: "", body: "", category: "email" });
  const [savingTmpl, setSavingTmpl] = useState(false);

  async function fetchData() {
    try {
      const [seqData, tmplData] = await Promise.all([
        getSequences(),
        getTemplates(),
      ]);
      setSequences(seqData);
      setTemplates(tmplData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreateSequence(e: React.FormEvent) {
    e.preventDefault();
    if (!seqForm.name.trim()) return;
    setSavingSeq(true);
    try {
      await createSequence(seqForm);
      setShowNewSeq(false);
      setSeqForm({ name: "" });
      fetchData();
    } catch (err) {
      console.error("Failed to create sequence", err);
    } finally {
      setSavingSeq(false);
    }
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!tmplForm.name.trim() || !tmplForm.body.trim()) return;
    setSavingTmpl(true);
    try {
      await createTemplate(tmplForm);
      setShowNewTmpl(false);
      setTmplForm({ name: "", body: "", category: "email" });
      fetchData();
    } catch (err) {
      console.error("Failed to create template", err);
    } finally {
      setSavingTmpl(false);
    }
  }

  async function handleDeleteSequence(id: string) {
    if (!confirm("Delete this sequence and all its steps?")) return;
    try {
      await deleteSequence(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete sequence", err);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete template", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const channelIcons: Record<string, string> = {
    email: "\u2709",
    call_script: "\u260E",
    linkedin: "\uD83D\uDD17",
    sms: "\uD83D\uDCF1",
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Sequences &amp; Templates</h1>
            <p className="mt-1 text-sm text-slate-400">
              Automated outreach cadences and reusable message templates
            </p>
          </div>
          <div className="self-start sm:self-auto">
            <HelpPanel
              pageKey="sequences"
              tagline="Do not freestyle follow-up. Use sequences so we can run the same playbook across accounts and know exactly what works."
              sections={[
                {
                  title: "Sequences",
                  content: [
                    "A sequence is a multi-step outreach cadence: email day 1, call day 3, LinkedIn day 5, etc.",
                    "Create sequences for common scenarios: new account outreach, post-sample follow-up, reorder check-in",
                    "Enroll opportunities in a sequence and the system tracks which step you are on and when the next one is due",
                    "Complete each step as you go. If you skip a step, the system will flag it.",
                  ],
                },
                {
                  title: "Templates",
                  content: [
                    "Templates are reusable message bodies for emails, call scripts, LinkedIn messages, and SMS",
                    "Use {{contact_name}}, {{company_name}}, {{product_name}} variables for personalization",
                    "Tag templates by stage so the right message appears at the right time",
                    "Do not write emails from scratch every time. Pick a template, personalize it, send it.",
                  ],
                },
                {
                  title: "Best practice",
                  content: [
                    "Every new account should be enrolled in your \u201CNew Account Outreach\u201D sequence within 24 hours of creation",
                    "Review sequence performance monthly: which cadences lead to meetings? Which get ignored?",
                    "Update templates quarterly based on what actually converts",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700 pb-px">
        {(["sequences", "templates"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? "bg-slate-800 text-white border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "sequences" ? `Sequences (${sequences.length})` : `Templates (${templates.length})`}
          </button>
        ))}
      </div>

      {/* Sequences Tab */}
      {activeTab === "sequences" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowNewSeq(!showNewSeq)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              + New Sequence
            </button>
          </div>

          {showNewSeq && (
            <form onSubmit={handleCreateSequence} className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sequence Name *</label>
                  <input
                    required
                    value={seqForm.name}
                    onChange={(e) => setSeqForm({ ...seqForm, name: e.target.value })}
                    placeholder="New Account Outreach"
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Stage</label>
                  <select
                    value={seqForm.target_stage || ""}
                    onChange={(e) => setSeqForm({ ...seqForm, target_stage: e.target.value || undefined })}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Any Stage</option>
                    {OPPORTUNITY_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description</label>
                  <input
                    value={seqForm.description || ""}
                    onChange={(e) => setSeqForm({ ...seqForm, description: e.target.value })}
                    placeholder="7-step intro cadence"
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNewSeq(false)} className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={savingSeq} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                  {savingSeq ? "Creating..." : "Create Sequence"}
                </button>
              </div>
            </form>
          )}

          {sequences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No sequences yet. Create your first outreach cadence.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sequences.map((seq) => (
                <div key={seq.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/sequences/${seq.id}`} className="text-sm font-medium text-white hover:text-indigo-400 transition-colors">
                          {seq.name}
                        </Link>
                        {!seq.is_active && (
                          <span className="rounded bg-slate-600/20 px-1.5 py-0.5 text-[10px] text-slate-400">INACTIVE</span>
                        )}
                        {seq.target_stage && (
                          <span className="rounded bg-indigo-600/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                            {stageLabelMap[seq.target_stage] || seq.target_stage}
                          </span>
                        )}
                      </div>
                      {seq.description && (
                        <p className="text-xs text-slate-400 mt-1">{seq.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>{seq.step_count || 0} steps</span>
                        <span>{seq.active_enrollments || 0} active enrollments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/sequences/${seq.id}`} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteSequence(seq.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowNewTmpl(!showNewTmpl)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              + New Template
            </button>
          </div>

          {showNewTmpl && (
            <form onSubmit={handleCreateTemplate} className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Template Name *</label>
                  <input
                    required
                    value={tmplForm.name}
                    onChange={(e) => setTmplForm({ ...tmplForm, name: e.target.value })}
                    placeholder="First Touch Email"
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={tmplForm.category || "email"}
                    onChange={(e) => setTmplForm({ ...tmplForm, category: e.target.value })}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="call_script">Call Script</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stage</label>
                  <select
                    value={tmplForm.stage || ""}
                    onChange={(e) => setTmplForm({ ...tmplForm, stage: e.target.value || undefined })}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Any Stage</option>
                    {OPPORTUNITY_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(tmplForm.category === "email") && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subject</label>
                  <input
                    value={tmplForm.subject || ""}
                    onChange={(e) => setTmplForm({ ...tmplForm, subject: e.target.value })}
                    placeholder="Introduction: {{company_name}} x BullFit"
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Body *</label>
                <textarea
                  required
                  rows={5}
                  value={tmplForm.body}
                  onChange={(e) => setTmplForm({ ...tmplForm, body: e.target.value })}
                  placeholder="Hi {{contact_name}},&#10;&#10;I wanted to reach out about..."
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Use {"{{variable_name}}"} for dynamic content. Common: {"{{contact_name}}"}, {"{{company_name}}"}, {"{{product_name}}"}
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNewTmpl(false)} className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={savingTmpl} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                  {savingTmpl ? "Creating..." : "Create Template"}
                </button>
              </div>
            </form>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No templates yet. Create reusable message templates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base flex-shrink-0">{channelIcons[tmpl.category] || "\u2709"}</span>
                        <p className="text-sm font-medium text-white">{tmpl.name}</p>
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 capitalize">
                          {tmpl.category?.replace("_", " ")}
                        </span>
                        {tmpl.stage && (
                          <span className="rounded bg-indigo-600/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                            {stageLabelMap[tmpl.stage] || tmpl.stage}
                          </span>
                        )}
                        {!tmpl.is_active && (
                          <span className="rounded bg-slate-600/20 px-1.5 py-0.5 text-[10px] text-slate-400">INACTIVE</span>
                        )}
                      </div>
                      {tmpl.subject && (
                        <p className="text-xs text-slate-400 mt-1">Subject: {tmpl.subject}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.body}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="text-xs text-red-400 hover:text-red-300 ml-3 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
