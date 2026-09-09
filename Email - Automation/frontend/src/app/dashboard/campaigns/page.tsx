"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Send,
  Plus,
  Mail,
  Trash2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { api, CampaignItem } from "@/lib/api";

const initialCampaignsFallback: CampaignItem[] = [
  {
    id: "1",
    name: "Welcome Onboarding Sequence",
    subject: "Welcome to MailFlow!",
    status: "completed",
    content_html: "<h1>Welcome</h1><p>Thanks for joining!</p>",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Summer Mega Flash Sale",
    subject: "Up to 50% off all catalog items",
    status: "draft",
    content_html: "<h1>Summer Sale</h1>",
    created_at: "2026-09-02T00:00:00.000Z",
  },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testModalCamp, setTestModalCamp] = useState<CampaignItem | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.campaigns.list();
      setCampaigns(res);
    } catch {
      setCampaigns(initialCampaignsFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.campaigns
      .list()
      .then((res) => {
        if (active) {
          setCampaigns(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setCampaigns(initialCampaignsFallback);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSendNow = async (id: string) => {
    try {
      setActionMessage("Dispatching campaign emails...");
      const res = await api.campaigns.send(id);
      setActionMessage(`Campaign sent successfully to ${res.sent_count} subscribers.`);
      refreshCampaigns();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      setActionMessage(`Send failed: ${msg}`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalCamp || !testEmail) return;
    setTestSending(true);
    setTestResult(null);
    try {
      await api.campaigns.test(testModalCamp.id, testEmail);
      setTestResult(`Test email dispatched successfully to ${testEmail}!`);
      setTimeout(() => {
        setTestModalCamp(null);
        setTestResult(null);
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send test";
      setTestResult(`Error: ${msg}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.campaigns.delete(id);
      setCampaigns(campaigns.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      alert(`Delete failed: ${msg}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage, schedule, and broadcast email blasts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshCampaigns}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/builder">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </motion.div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((camp, i) => {
          const isCompleted = camp.status?.toLowerCase() === "completed";
          const isSending = camp.status?.toLowerCase() === "sending";

          return (
            <motion.div
              key={camp.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-1">
                    {camp.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize shrink-0 ${
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : isSending
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {camp.status || "Draft"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  Subject: <span className="text-foreground">{camp.subject}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTestModalCamp(camp)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Test
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={() => handleSendNow(camp.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Broadcast
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(camp.id)}
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

      {/* Test Email Modal */}
      {testModalCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold">Send Test Email</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Deliver a sandbox test preview of &quot;{testModalCamp.name}&quot; to any recipient.
            </p>

            {testResult && (
              <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                {testResult}
              </div>
            )}

            <form onSubmit={handleSendTest} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@company.com"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalCamp(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testSending ? "Sending..." : "Send Test Now"}
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
