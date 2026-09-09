"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { api, ContactItem } from "@/lib/api";

interface ImportResultType {
  total_rows?: number;
  imported_count?: number;
  duplicate_count?: number;
  invalid_count?: number;
  errors?: string[];
  imported?: number;
  skipped_duplicates?: number;
  error?: string;
}

const initialContactsFallback: ContactItem[] = [
  { id: "1", email: "john@example.com", first_name: "John", last_name: "Doe", attributes: {}, is_subscribed: true, created_at: "2 days ago" },
  { id: "2", email: "sarah@acme.inc", first_name: "Sarah", last_name: "Smith", attributes: {}, is_subscribed: true, created_at: "1 week ago" },
  { id: "3", email: "bounced@bad.domain", first_name: "Alex", last_name: "Taylor", attributes: {}, is_subscribed: false, created_at: "2 weeks ago" },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultType | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const refreshContacts = async () => {
    setLoading(true);
    try {
      const res = await api.contacts.list({ search, status: statusFilter || undefined });
      setContacts(res);
    } catch {
      setContacts(initialContactsFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.contacts
      .list({ search, status: statusFilter || undefined })
      .then((res) => {
        if (active) {
          setContacts(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setContacts(initialContactsFallback);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [search, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshContacts();
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.contacts.create({
        email: newEmail,
        first_name: newFirstName,
        last_name: newLastName,
      });
      setSuccessBanner(`Contact ${newEmail} added successfully!`);
      setShowAddModal(false);
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      refreshContacts();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add contact.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.contacts.importCsv(csvFile);
      setImportResult(res);
      setSuccessBanner(`Imported ${res.imported} contacts (${res.skipped_duplicates} duplicates skipped).`);
      refreshContacts();
      setTimeout(() => {
        setShowImportModal(false);
        setCsvFile(null);
        setImportResult(null);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed.";
      setImportResult({ error: msg });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await api.contacts.delete(id);
      setContacts(contacts.filter((c) => c.id !== id));
      setSuccessBanner("Contact deleted successfully.");
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      alert(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audience & Contacts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage subscriber attributes, status, and list segmentation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary px-4 py-2 text-sm font-medium transition-all"
          >
            <Upload className="w-4 h-4 text-muted-foreground" /> Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {successBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="h-10 w-full rounded-xl border border-border bg-secondary/40 pl-9 pr-4 text-sm outline-none focus:border-primary transition-all"
            />
          </form>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
            <button
              onClick={refreshContacts}
              className="p-2.5 rounded-xl border border-border hover:bg-secondary text-muted-foreground"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="px-6 py-3 font-semibold">Subscriber</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {contacts.map((c) => {
                const isSub = c.is_subscribed !== false;
                const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";

                return (
                  <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{c.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isSub
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {isSub ? "Subscribed" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {contacts.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No contacts found. Click &quot;Add Contact&quot; or &quot;Import CSV&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold">Add New Contact</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add a single subscriber to your active recipient list.
            </p>

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateContact} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="subscriber@domain.com"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold">Import Contacts via CSV</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a CSV file containing columns: <code className="text-primary font-mono">email</code>, <code className="font-mono">first_name</code>, <code className="font-mono">last_name</code>.
            </p>

            {importResult?.error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {importResult.error}
              </div>
            )}

            {importResult?.imported !== undefined && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                Successfully imported {importResult.imported} contacts!
              </div>
            )}

            <form onSubmit={handleImportCsv} className="mt-4 space-y-4">
              <div className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-secondary/20">
                <FileSpreadsheet className="w-10 h-10 text-primary/70 mb-2" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {csvFile && (
                  <p className="text-xs text-foreground mt-2 font-medium">
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importing}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Upload & Sync"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
