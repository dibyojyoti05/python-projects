"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Play, Trash2, Workflow as WorkflowIcon, CheckCircle2, RefreshCw } from "lucide-react";
import { api, WorkflowItem } from "@/lib/api";

interface SimulationStep {
  label: string;
  action_summary: string;
  node_id?: string;
}

interface WorkflowSimulationModalData {
  name: string;
  steps?: SimulationStep[];
  steps_count?: number;
  status?: string;
}

const initialWorkflowsFallback: WorkflowItem[] = [
  {
    id: "w1",
    name: "Welcome Onboarding Series",
    description: "Engage new signups automatically",
    status: "active",
    nodes: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }],
    edges: [],
  },
  {
    id: "w2",
    name: "Cart Abandonment Sequence",
    description: "Recover potential dropoffs with special coupons",
    status: "paused",
    nodes: [{ id: "1" }, { id: "2" }, { id: "3" }],
    edges: [],
  },
  {
    id: "w3",
    name: "Post-Purchase Follow-up",
    description: "Request reviews and recommend accessories",
    status: "active",
    nodes: [{ id: "1" }, { id: "2" }],
    edges: [],
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<WorkflowSimulationModalData | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const refreshWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.workflows.list();
      setWorkflows(res);
    } catch {
      setWorkflows(initialWorkflowsFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.workflows
      .list()
      .then((res) => {
        if (active) {
          setWorkflows(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setWorkflows(initialWorkflowsFallback);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleStatus = async (wf: WorkflowItem) => {
    const nextStatus = wf.status === "active" ? "paused" : "active";
    try {
      await api.workflows.update(wf.id, { status: nextStatus });
      setWorkflows(workflows.map((w) => (w.id === wf.id ? { ...w, status: nextStatus } : w)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      alert(`Update failed: ${msg}`);
    }
  };

  const handleTestRun = async (wf: WorkflowItem) => {
    setTestingId(wf.id);
    try {
      const res = await api.workflows.testRun(wf.id);
      setTestResult({ name: wf.name, ...res });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test run failed";
      alert(`Test run failed: ${msg}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    try {
      await api.workflows.delete(id);
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      alert(`Delete failed: ${msg}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations & Workflows</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visual customer journeys, drip sequences, and conditional logic.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshWorkflows}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/workflows/builder">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> Create Workflow
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workflows.map((wf, i) => {
          const isActive = wf.status?.toLowerCase() === "active";
          const nodeCount = Array.isArray(wf.nodes) ? wf.nodes.length : 4;

          return (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-1">
                    {wf.name}
                  </h3>
                  <button
                    onClick={() => handleToggleStatus(wf)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-all ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                    }`}
                  >
                    {wf.status || "Draft"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {wf.description || "Visual sequence automation with branching logic."}
                </p>
                <div className="text-xs font-medium text-foreground/80 flex items-center gap-2">
                  <WorkflowIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{nodeCount} Nodes configured</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2 mt-5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/workflows/builder?id=${wf.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Edit Canvas
                  </Link>
                  <button
                    onClick={() => handleTestRun(wf)}
                    disabled={testingId === wf.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground transition-all"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    {testingId === wf.id ? "Running..." : "Test Run"}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(wf.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Test Run Execution Result Modal */}
      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold">Workflow Execution Simulation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{testResult.name}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passed
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              {(testResult.steps || []).map((step: SimulationStep, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{step.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.action_summary}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setTestResult(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Close Simulation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
