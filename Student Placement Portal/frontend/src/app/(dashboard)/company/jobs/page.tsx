"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { Building2, Plus, Users, MapPin, Briefcase, DollarSign, CheckCircle2 } from "lucide-react";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  job_type: string;
  salary_range: string;
  is_active: boolean;
}

interface Company {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  headquarters?: string;
}

interface RecruiterProfile {
  id: number;
  company_id?: number;
  company?: Company;
}

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Company Setup Form
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "",
    website: "",
    headquarters: "",
    description: "",
    company_size: "100-500"
  });
  const [settingUpCompany, setSettingUpCompany] = useState(false);

  // Job Form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    job_type: "Full-time",
    salary_range: "",
    deadline: "",
    min_cgpa: "",
    max_backlogs: "0",
    eligible_branches: ""
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [recData, jobsData] = await Promise.all([
        fetchApi("/companies/me").catch(() => null),
        fetchApi("/jobs/company/me").catch(() => [])
      ]);
      setRecruiter(recData);
      setJobs(jobsData || []);
    } catch (error) {
      console.error("Failed to load company data", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingUpCompany(true);
    try {
      const updatedProfile = await fetchApi("/companies/setup", {
        method: "POST",
        body: JSON.stringify(companyForm),
      });
      setRecruiter(updatedProfile);
      alert("Company profile created and linked successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to setup company profile");
    } finally {
      setSettingUpCompany(false);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJob(true);
    try {
      const payload: any = {
        title: jobFormData.title,
        description: jobFormData.description,
        requirements: jobFormData.requirements,
        location: jobFormData.location,
        job_type: jobFormData.job_type,
        salary_range: jobFormData.salary_range,
        eligible_branches: jobFormData.eligible_branches || null,
        min_cgpa: jobFormData.min_cgpa ? parseFloat(jobFormData.min_cgpa) : 0.0,
        max_backlogs: jobFormData.max_backlogs ? parseInt(jobFormData.max_backlogs) : 0,
        deadline: jobFormData.deadline ? new Date(jobFormData.deadline).toISOString() : null,
      };

      await fetchApi("/jobs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowJobForm(false);
      setJobFormData({
        title: "", description: "", requirements: "", location: "", job_type: "Full-time", salary_range: "",
        deadline: "", min_cgpa: "", max_backlogs: "0", eligible_branches: ""
      });
      const updatedJobs = await fetchApi("/jobs/company/me");
      setJobs(updatedJobs || []);
      alert("Job posted successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to post job");
    } finally {
      setSubmittingJob(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If Recruiter has not linked or created a company yet
  if (!recruiter?.company_id) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Set Up Your Company Profile</h1>
              <p className="text-sm text-slate-500">Associate your recruiter account with a company to begin posting jobs.</p>
            </div>
          </div>

          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Google, Infosys, Acme Corp"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. Software & Cloud"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://example.com"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Headquarters Location</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Bangalore, India"
                value={companyForm.headquarters}
                onChange={(e) => setCompanyForm({ ...companyForm, headquarters: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Company Description</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Brief overview of company and mission..."
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={settingUpCompany}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {settingUpCompany ? "Saving Company..." : "Complete Company Setup"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {recruiter.company?.name || "Company"} Career Openings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Verified Partner
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish recruitment opportunities and review student candidate applications.
          </p>
        </div>

        <button
          onClick={() => setShowJobForm(!showJobForm)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" /> {showJobForm ? "Close Form" : "Post New Opening"}
        </button>
      </div>

      {/* Post Job Form */}
      {showJobForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-in fade-in duration-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Job Drive Opening</h2>
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Graduate Software Engineer"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Job Type</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={jobFormData.job_type}
                  onChange={(e) => setJobFormData({ ...jobFormData, job_type: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Bangalore / Remote"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Salary / Compensation Range</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. ₹18,00,000 - ₹24,00,000 PA"
                  value={jobFormData.salary_range}
                  onChange={(e) => setJobFormData({ ...jobFormData, salary_range: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Job Description *</label>
              <textarea
                rows={4}
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Describe role responsibilities, tech stack, and expectations..."
                value={jobFormData.description}
                onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Key Skills & Requirements</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Proficient in Python, SQL, REST APIs, Git..."
                value={jobFormData.requirements}
                onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
              />
            </div>

            {/* Automated Placement Eligibility Criteria */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Structured Placement Eligibility Criteria
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="e.g. 7.5 (0 for none)"
                    value={jobFormData.min_cgpa}
                    onChange={(e) => setJobFormData({ ...jobFormData, min_cgpa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="0"
                    value={jobFormData.max_backlogs}
                    onChange={(e) => setJobFormData({ ...jobFormData, max_backlogs: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={jobFormData.deadline}
                    onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Eligible Branches (comma-separated, leave blank for all)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  placeholder="e.g. Computer Science, Information Technology, Electronics"
                  value={jobFormData.eligible_branches}
                  onChange={(e) => setJobFormData({ ...jobFormData, eligible_branches: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowJobForm(false)}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingJob}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50"
              >
                {submittingJob ? "Posting..." : "Publish Job Opening"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Active Job Openings ({jobs.length})</h2>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No job openings created yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Click "Post New Opening" above to create your first campus drive role.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {job.job_type}
                    </span>
                    {job.is_active && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                    )}
                    {job.salary_range && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> {job.salary_range}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/company/jobs/${job.id}/applicants`}
                    className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors border border-blue-200"
                  >
                    <Users className="w-4 h-4" /> View Candidates
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
