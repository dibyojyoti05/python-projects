"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Building2, CheckCircle2, XCircle, ExternalLink, Briefcase, Users, ShieldCheck } from "lucide-react";

interface AdminCompany {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  headquarters?: string;
  company_size?: string;
  is_verified: boolean;
  jobs_count: number;
  recruiters_count: number;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadCompanies = async () => {
    try {
      const data = await fetchApi("/admin/companies");
      setCompanies(data || []);
    } catch (err) {
      console.error("Failed to load companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleToggleVerify = async (companyId: number) => {
    setTogglingId(companyId);
    try {
      const res = await fetchApi(`/admin/companies/${companyId}/verify`, { method: "PATCH" });
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, is_verified: res.is_verified } : c))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update company verification");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Placement Office Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Company Partner Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify corporate recruiting partners before their job postings go live to university students.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-100 rounded-2xl text-center">
          <span className="text-xs text-slate-500 block">Total Companies</span>
          <strong className="text-xl font-black text-slate-900">{companies.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <span className="text-xs text-slate-500">{c.industry || "Technology & Services"}</span>
                  </div>
                </div>

                {c.is_verified ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <XCircle className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {c.jobs_count} Drives Posted
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {c.recruiters_count} Recruiters
                </div>
                {c.headquarters && <div className="col-span-2 text-slate-500 text-[11px]">HQ: {c.headquarters}</div>}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {c.website ? (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Visit Website <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">No website</span>
              )}

              <button
                onClick={() => handleToggleVerify(c.id)}
                disabled={togglingId === c.id}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  c.is_verified
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {togglingId === c.id
                  ? "Updating..."
                  : c.is_verified
                  ? "Revoke Approval"
                  : "Approve Company"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
