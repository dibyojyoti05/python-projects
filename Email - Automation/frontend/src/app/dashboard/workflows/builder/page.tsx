"use client";

import React, { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Save,
  Play,
  Zap,
  Mail,
  Clock,
  GitBranch,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface WorkflowSimulationStep {
  label: string;
  action_summary: string;
  node_id?: string;
}

interface WorkflowSimulationResult {
  workflow_id?: string;
  workflow_name?: string;
  steps_count?: number;
  status?: string;
  success?: boolean;
  error?: string;
  steps?: WorkflowSimulationStep[];
}

const initialNodes: Node[] = [
  { id: "1", position: { x: 250, y: 50 }, data: { label: "Trigger: New Subscriber" }, type: "input" },
  { id: "2", position: { x: 250, y: 150 }, data: { label: "Send Welcome Email" } },
  { id: "3", position: { x: 250, y: 250 }, data: { label: "Wait 3 Days" } },
  { id: "4", position: { x: 250, y: 350 }, data: { label: "Condition: Opened Email?" }, type: "default" },
  { id: "5", position: { x: 100, y: 470 }, data: { label: "Send Promo Email" }, type: "output" },
  { id: "6", position: { x: 400, y: 470 }, data: { label: "Send Reminder Drip" }, type: "output" },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5", label: "Yes" },
  { id: "e4-6", source: "4", target: "6", label: "No" },
];

let nodeCounter = 0;
function generateNodeId(): string {
  nodeCounter += 1;
  return `node_${nodeCounter}_${Date.now()}`;
}

function WorkflowBuilderContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");

  const [workflowName, setWorkflowName] = useState("Customer Onboarding Journey");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Simulation test state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<WorkflowSimulationResult | null>(null);
  const [currentWfId, setCurrentWfId] = useState<string | null>(workflowId);

  useEffect(() => {
    if (workflowId) {
      api.workflows
        .get(workflowId)
        .then((wf) => {
          setWorkflowName(wf.name);
          if (Array.isArray(wf.nodes) && wf.nodes.length > 0) setNodes(wf.nodes as unknown as Node[]);
          if (Array.isArray(wf.edges) && wf.edges.length > 0) setEdges(wf.edges as unknown as Edge[]);
          setCurrentWfId(wf.id);
        })
        .catch(() => {});
    }
  }, [workflowId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string, label: string) => {
    const newId = generateNodeId();
    const newNode: Node = {
      id: newId,
      position: { x: 250 + Math.random() * 80 - 40, y: 150 + nodes.length * 60 },
      data: { label },
      type: type === "trigger" ? "input" : type === "action" ? "output" : "default",
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusBanner(null);
    try {
      if (currentWfId) {
        await api.workflows.update(currentWfId, {
          name: workflowName,
          nodes,
          edges,
        });
        setStatusBanner("Workflow saved successfully!");
      } else {
        const res = await api.workflows.create({
          name: workflowName,
          nodes,
          edges,
          status: "active",
        });
        setCurrentWfId(res.id);
        setStatusBanner("Workflow created and saved!");
      }
      setTimeout(() => setStatusBanner(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save error";
      setStatusBanner(`Save error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestRun = async () => {
    setTestModalOpen(true);
    setTesting(true);
    try {
      let wfId = currentWfId;
      if (!wfId) {
        const res = await api.workflows.create({
          name: workflowName,
          nodes,
          edges,
          status: "active",
        });
        wfId = res.id;
        setCurrentWfId(wfId);
      }
      const res = await api.workflows.testRun(wfId);
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test run failed";
      setTestResult({ success: false, error: msg, steps: [] });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col border border-border/80 rounded-2xl overflow-hidden bg-background shadow-xl">
      {/* Canvas Topbar */}
      <div className="h-16 border-b border-border/80 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
            Workflow:
          </span>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent font-bold text-foreground focus:outline-none focus:border-b border-primary text-base w-72"
          />
        </div>

        <div className="flex items-center gap-3">
          {statusBanner && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {statusBanner}
            </span>
          )}
          <button
            onClick={handleTestRun}
            className="inline-flex items-center justify-center rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary h-9 px-3.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Simulate Run
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving..." : "Save Canvas"}
          </button>
        </div>
      </div>

      {/* Main Builder Area with Node Palette */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Floating Quick Node Add Bar */}
        <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-md border border-border rounded-xl p-2 shadow-xl flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase px-2">Add Step:</span>
          <button
            onClick={() => addNode("trigger", "Trigger: Event / Tag")}
            className="p-2 rounded-lg hover:bg-secondary text-xs flex items-center gap-1 text-foreground transition-all"
            title="Add Trigger"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Trigger
          </button>
          <button
            onClick={() => addNode("email", "Send Marketing Email")}
            className="p-2 rounded-lg hover:bg-secondary text-xs flex items-center gap-1 text-foreground transition-all"
            title="Send Email"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" /> Email
          </button>
          <button
            onClick={() => addNode("delay", "Wait 2 Days")}
            className="p-2 rounded-lg hover:bg-secondary text-xs flex items-center gap-1 text-foreground transition-all"
            title="Add Delay"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Delay
          </button>
          <button
            onClick={() => addNode("condition", "Condition: Link Clicked?")}
            className="p-2 rounded-lg hover:bg-secondary text-xs flex items-center gap-1 text-foreground transition-all"
            title="Add Condition"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> Condition
          </button>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-slate-950"
          >
            <Controls className="!bg-card !border-border !text-foreground !fill-foreground" />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-card/80 !border-border rounded-xl overflow-hidden"
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
          </ReactFlow>
        </div>
      </div>

      {/* Test Run Execution Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold">Automation Simulation</h3>
              <button onClick={() => setTestModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {testing ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Evaluating workflow graph and conditions...
              </div>
            ) : testResult ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Traversed {testResult.steps_count} steps successfully!
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(testResult.steps || []).map((step: WorkflowSimulationStep, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-secondary/40 border border-border/60 text-xs">
                      <div className="font-semibold text-foreground">{step.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{step.action_summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading canvas...</div>}>
      <WorkflowBuilderContent />
    </Suspense>
  );
}
