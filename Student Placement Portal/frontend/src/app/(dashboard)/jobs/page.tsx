"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { Briefcase, Building2, MapPin, DollarSign, Search, Calendar, Clock } from "lucide-react";

interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  job_type: string;
  salary_range: string;
  deadline?: string;
  min_cgpa?: number;
  max_backlogs?: number;
  eligible_branches?: string;
  company_id: number;
  company_name?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await fetchApi("/jobs");
        setJobs(data || []);
      } catch (error) {
        console.error("Failed to load jobs", error);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.company_name && j.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (j.location && j.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Campus Placement Drives</h1>
          <p className="text-sm text-slate-500 mt-1">Explore verified full-time roles and internships from our corporate partners.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search role, company, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Job Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching jobs found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {job.job_type || "Full-time"}
                    </span>
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Closed
                      </span>
                    ) : job.deadline ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Closes: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    {job.company_name && (
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" /> {job.company_name}
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2">
                      {job.title}
                    </h2>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Eligibility chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.min_cgpa !== undefined && job.min_cgpa > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Min CGPA: {job.min_cgpa}
                      </span>
                    )}
                    {job.eligible_branches && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 truncate max-w-[200px]">
                        {job.eligible_branches}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-500 font-medium">
                  {job.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                    </div>
                  )}
                  {job.salary_range && (
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {job.salary_range}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
