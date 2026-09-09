"use client";

import { useEffect, useState } from "react";
import { fetchApi, getResumeUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, Plus, Trash2, ExternalLink, FolderGit2, Award,
  Briefcase, GraduationCap, Code2, Download
} from "lucide-react";

interface Skill {
  id: number;
  name: string;
  proficiency: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  technologies: string;
  github_url?: string;
  live_url?: string;
}

interface Internship {
  id: number;
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  description: string;
}

interface Certification {
  id: number;
  name: string;
  issuing_organization: string;
  issue_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  grade: string;
}

interface Resume {
  id: number;
  file_name: string;
  uploaded_at?: string;
  is_primary: boolean;
}

interface StudentProfile {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  college?: string;
  department?: string;
  degree?: string;
  graduation_year?: number;
  cgpa?: number;
  backlogs?: number;
  skills: Skill[];
  projects: Project[];
  internships: Internship[];
  certifications: Certification[];
  educations: Education[];
  resumes: Resume[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "skills" | "projects" | "experience" | "education" | "resume">("personal");

  // Sub-entity Form States
  const [skillForm, setSkillForm] = useState({ name: "", proficiency: "Intermediate" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", technologies: "", github_url: "", live_url: "" });
  const [internshipForm, setInternshipForm] = useState({ company: "", role: "", start_date: "", end_date: "", description: "" });
  const [eduForm, setEduForm] = useState({ institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", grade: "" });

  const loadProfile = async () => {
    try {
      const p = await fetchApi("/students/me");
      setProfile(p);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await fetchApi("/students/me", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          gender: profile.gender,
          date_of_birth: profile.date_of_birth,
          college: profile.college,
          department: profile.department,
          degree: profile.degree,
          graduation_year: profile.graduation_year,
          cgpa: profile.cgpa,
          backlogs: profile.backlogs,
        }),
      });
      setProfile((prev) => ({ ...prev!, ...updated }));
      alert("Academic & personal details saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetchApi("/students/me/resume", {
        method: "POST",
        body: formData,
      });
      alert("Resume uploaded successfully!");
      loadProfile();
    } catch (err: any) {
      alert(err.message || "Failed to upload resume");
    }
  };

  // Skill actions
  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;
    try {
      const newSkill = await fetchApi("/students/skills", {
        method: "POST",
        body: JSON.stringify(skillForm),
      });
      setProfile((prev) => ({ ...prev!, skills: [...(prev?.skills || []), newSkill] }));
      setSkillForm({ name: "", proficiency: "Intermediate" });
    } catch (err: any) {
      alert(err.message || "Failed to add skill");
    }
  };

  const deleteSkill = async (id: number) => {
    try {
      await fetchApi(`/students/skills/${id}`, { method: "DELETE" });
      setProfile((prev) => ({
        ...prev!,
        skills: prev!.skills.filter((s) => s.id !== id),
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete skill");
    }
  };

  // Project actions
  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    try {
      const newProj = await fetchApi("/students/projects", {
        method: "POST",
        body: JSON.stringify(projectForm),
      });
      setProfile((prev) => ({ ...prev!, projects: [...(prev?.projects || []), newProj] }));
      setProjectForm({ name: "", description: "", technologies: "", github_url: "", live_url: "" });
    } catch (err: any) {
      alert(err.message || "Failed to add project");
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await fetchApi(`/students/projects/${id}`, { method: "DELETE" });
      setProfile((prev) => ({
        ...prev!,
        projects: prev!.projects.filter((p) => p.id !== id),
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  };

  // Internship actions
  const addInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internshipForm.company.trim() || !internshipForm.role.trim() || !internshipForm.start_date) return;
    try {
      const newInt = await fetchApi("/students/internships", {
        method: "POST",
        body: JSON.stringify(internshipForm),
      });
      setProfile((prev) => ({ ...prev!, internships: [...(prev?.internships || []), newInt] }));
      setInternshipForm({ company: "", role: "", start_date: "", end_date: "", description: "" });
    } catch (err: any) {
      alert(err.message || "Failed to add internship");
    }
  };

  const deleteInternship = async (id: number) => {
    try {
      await fetchApi(`/students/internships/${id}`, { method: "DELETE" });
      setProfile((prev) => ({
        ...prev!,
        internships: prev!.internships.filter((i) => i.id !== id),
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete internship");
    }
  };

  // Education actions
  const addEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution.trim() || !eduForm.degree.trim() || !eduForm.start_date) return;
    try {
      const newEdu = await fetchApi("/students/education", {
        method: "POST",
        body: JSON.stringify(eduForm),
      });
      setProfile((prev) => ({ ...prev!, educations: [...(prev?.educations || []), newEdu] }));
      setEduForm({ institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", grade: "" });
    } catch (err: any) {
      alert(err.message || "Failed to add education");
    }
  };

  const deleteEducation = async (id: number) => {
    try {
      await fetchApi(`/students/education/${id}`, { method: "DELETE" });
      setProfile((prev) => ({
        ...prev!,
        educations: prev!.educations.filter((e) => e.id !== id),
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete education");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  const primaryResume = profile.resumes?.find((r) => r.is_primary) || profile.resumes?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              Student Placement Profile
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              {profile.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Student Profile"}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {profile.department || "No Department"} • {profile.college || "No College"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
              <span className="text-xs text-blue-200 block">Current CGPA</span>
              <span className="text-xl font-black">{profile.cgpa ? profile.cgpa.toFixed(2) : "N/A"}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
              <span className="text-xs text-blue-200 block">Active Backlogs</span>
              <span className="text-xl font-black">{profile.backlogs ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/15">
          {[
            { id: "personal", label: "Academic Info", icon: GraduationCap },
            { id: "skills", label: `Skills (${profile.skills?.length || 0})`, icon: Code2 },
            { id: "projects", label: `Projects (${profile.projects?.length || 0})`, icon: FolderGit2 },
            { id: "experience", label: `Internships (${profile.internships?.length || 0})`, icon: Briefcase },
            { id: "education", label: `Education (${profile.educations?.length || 0})`, icon: Award },
            { id: "resume", label: "Resume Hub", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-white text-blue-700 shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ACADEMIC & PERSONAL INFO */}
      {activeTab === "personal" && (
        <Card className="rounded-3xl shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Academic & Contact Information</CardTitle>
            <CardDescription>
              Keep your CGPA, backlogs, and college details updated. Companies use these criteria for eligibility filtering.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSavePersonal}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">First Name</Label>
                  <Input
                    value={profile.first_name || ""}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="e.g. John"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Last Name</Label>
                  <Input
                    value={profile.last_name || ""}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="e.g. Doe"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                  <Input
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Gender</Label>
                  <Input
                    value={profile.gender || ""}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    placeholder="Male / Female / Other"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">College / University</Label>
                  <Input
                    value={profile.college || ""}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    placeholder="e.g. Institute of Engineering"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Department / Branch</Label>
                  <Input
                    value={profile.department || ""}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    placeholder="e.g. Computer Science and Engineering"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Degree</Label>
                  <Input
                    value={profile.degree || ""}
                    onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                    placeholder="e.g. B.Tech / B.E."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Graduation Year</Label>
                  <Input
                    type="number"
                    value={profile.graduation_year || ""}
                    onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) || undefined })}
                    placeholder="e.g. 2026"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">CGPA (out of 10.0)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={profile.cgpa || ""}
                    onChange={(e) => setProfile({ ...profile, cgpa: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g. 8.5"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Active Backlogs</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.backlogs ?? 0}
                    onChange={(e) => setProfile({ ...profile, backlogs: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6">
                  {saving ? "Saving Changes..." : "Save Academic Details"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {/* TAB 2: SKILLS */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          {/* Add Skill Form */}
          <Card className="rounded-3xl shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Add New Technical Skill</CardTitle>
              <CardDescription>Add technologies, programming languages, and tools you excel at.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addSkill} className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  placeholder="e.g. React, Python, PostgreSQL, AWS"
                  className="rounded-xl flex-1"
                  required
                />
                <select
                  value={skillForm.proficiency}
                  onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-1">
                  <Plus className="w-4 h-4" /> Add Skill
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Skills List */}
          <Card className="rounded-3xl shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Your Skills ({profile.skills?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.skills?.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No skills added yet. Use the form above to showcase your capabilities!</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl group hover:border-slate-300 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-800">{skill.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {skill.proficiency}
                      </span>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {/* Add Project Form */}
          <Card className="rounded-3xl shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Add Portfolio Project</CardTitle>
              <CardDescription>Highlight real-world applications or academic capstone projects you built.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addProject} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Project Name (e.g. AI Placement Portal)"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="Technologies (e.g. Next.js, FastAPI, PostgreSQL)"
                    value={projectForm.technologies}
                    onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="GitHub URL (optional)"
                    value={projectForm.github_url}
                    onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Live Demo URL (optional)"
                    value={projectForm.live_url}
                    onChange={(e) => setProjectForm({ ...projectForm, live_url: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <textarea
                  placeholder="Describe what the project accomplishes, key features, and your role..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-1">
                  <Plus className="w-4 h-4" /> Add Project
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Project List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.projects?.map((project) => (
              <Card key={project.id} className="rounded-3xl shadow-sm border-slate-200 flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold text-slate-900">{project.name}</CardTitle>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {project.technologies && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {project.technologies.split(",").map((tech, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-2 text-xs text-slate-600 leading-relaxed">
                  <p>{project.description || "No description provided."}</p>
                  <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-blue-600"
                      >
                        <FolderGit2 className="w-3.5 h-3.5" /> Repository
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INTERNSHIPS / EXPERIENCE */}
      {activeTab === "experience" && (
        <div className="space-y-6">
          <Card className="rounded-3xl shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Add Work Experience / Internship</CardTitle>
              <CardDescription>Share your previous industrial experience or summer internships.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addInternship} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Company (e.g. Microsoft)"
                    value={internshipForm.company}
                    onChange={(e) => setInternshipForm({ ...internshipForm, company: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="Role (e.g. Software Engineering Intern)"
                    value={internshipForm.role}
                    onChange={(e) => setInternshipForm({ ...internshipForm, role: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <div>
                    <Label className="text-[11px] text-slate-500 block mb-1">Start Date</Label>
                    <Input
                      type="date"
                      value={internshipForm.start_date}
                      onChange={(e) => setInternshipForm({ ...internshipForm, start_date: e.target.value })}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500 block mb-1">End Date (optional)</Label>
                    <Input
                      type="date"
                      value={internshipForm.end_date}
                      onChange={(e) => setInternshipForm({ ...internshipForm, end_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Key responsibilities, achievements, and technologies used..."
                  value={internshipForm.description}
                  onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-1">
                  <Plus className="w-4 h-4" /> Add Experience
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {profile.internships?.map((exp) => (
              <Card key={exp.id} className="rounded-3xl shadow-sm border-slate-200">
                <CardContent className="p-5 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{exp.role}</h3>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-blue-600 text-sm">{exp.company}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      {exp.start_date} {exp.end_date ? `to ${exp.end_date}` : "— Present"}
                    </span>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                  </div>
                  <button
                    onClick={() => deleteInternship(exp.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EDUCATION */}
      {activeTab === "education" && (
        <div className="space-y-6">
          <Card className="rounded-3xl shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Add Education Background</CardTitle>
              <CardDescription>Record your high school (10th/12th), diploma, or previous degrees.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addEducation} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Institution (e.g. Delhi Public School / IIT)"
                    value={eduForm.institution}
                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="Degree (e.g. Higher Secondary / Bachelor of Technology)"
                    value={eduForm.degree}
                    onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="Field of Study (e.g. Science / Computer Science)"
                    value={eduForm.field_of_study}
                    onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Grade / Percentage / CGPA (e.g. 92% or 8.8 CGPA)"
                    value={eduForm.grade}
                    onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                    className="rounded-xl"
                  />
                  <div>
                    <Label className="text-[11px] text-slate-500 block mb-1">Start Date</Label>
                    <Input
                      type="date"
                      value={eduForm.start_date}
                      onChange={(e) => setEduForm({ ...eduForm, start_date: e.target.value })}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500 block mb-1">End Date</Label>
                    <Input
                      type="date"
                      value={eduForm.end_date}
                      onChange={(e) => setEduForm({ ...eduForm, end_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-1">
                  <Plus className="w-4 h-4" /> Add Education
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {profile.educations?.map((edu) => (
              <Card key={edu.id} className="rounded-3xl shadow-sm border-slate-200">
                <CardContent className="p-5 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{edu.degree} - {edu.field_of_study}</h3>
                    <span className="font-semibold text-slate-600 text-xs mt-0.5 block">{edu.institution}</span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {edu.start_date} {edu.end_date ? `to ${edu.end_date}` : ""} • Grade: <strong className="text-slate-800">{edu.grade || "N/A"}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => deleteEducation(edu.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RESUME HUB */}
      {activeTab === "resume" && (
        <div className="space-y-6">
          {/* Active Resume Status Card */}
          {primaryResume ? (
            <Card className="rounded-3xl shadow-sm border-emerald-200 bg-emerald-50/40">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{primaryResume.file_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                        Active Resume
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      This resume is automatically submitted when you apply for jobs.
                    </span>
                  </div>
                </div>

                <a
                  href={getResumeUrl(primaryResume.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  Preview / Download
                </a>
              </CardContent>
            </Card>
          ) : (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-amber-800 text-xs">
              ⚠️ You haven&apos;t uploaded a resume yet. Upload one below to be able to apply to campus recruitment drives.
            </div>
          )}

          {/* Upload New Resume */}
          <Card className="rounded-3xl shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Upload / Update Resume</CardTitle>
              <CardDescription>
                Accepted formats: PDF or DOCX (maximum 10MB). Uploading a new resume automatically sets it as your primary document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-blue-400 transition-colors">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-block shadow-sm">
                    Select Resume File
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-2">PDF files are strongly recommended for seamless recruiter viewing.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
