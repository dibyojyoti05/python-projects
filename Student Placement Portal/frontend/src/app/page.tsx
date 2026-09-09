import Link from "next/link";
import { Building2, GraduationCap, ShieldCheck, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PlaceMentor
              </span>
              <span className="text-xs block text-slate-500 font-medium">Campus Placement Portal</span>
            </div>
          </div>

          <nav className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/30 transition-all hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Official Centralized Placement Portal 2026
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
          Bridging Talented Students with{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            World-Class Careers
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An end-to-end recruitment management platform connecting students, university placement cells, and global recruiters in one streamlined ecosystem.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            Student Registration <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Building2 className="w-4 h-4 text-slate-500" /> Recruiter Sign In
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center max-w-5xl mx-auto pt-10 border-t border-slate-200">
          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-600">95.4%</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Placement Rate</div>
          </div>
          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">250+</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Hiring Partners</div>
          </div>
          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">₹40 LPA</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Highest Package</div>
          </div>
          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-600">1,200+</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Offers Extended</div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Tailored For Every Stakeholder</h2>
            <p className="text-slate-600 mt-2">Comprehensive toolsets engineered to make hiring seamless and transparent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Students */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Students</h3>
              <p className="text-slate-600 text-sm mb-6">
                Build your verified academic profile, upload your resume, and apply to top tier internships and full-time opportunities with 1-click.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Direct 1-Click Applications</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time Application Tracking</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Profile & Resume Hosting</li>
              </ul>
            </div>

            {/* For Recruiters */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Recruiters</h3>
              <p className="text-slate-600 text-sm mb-6">
                Set up your company profile, post roles with customized criteria, filter candidate pools, and update application statuses dynamically.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Job Postings</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete Candidate Dossiers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Shortlist & Review Pipeline</li>
              </ul>
            </div>

            {/* For Placement Cell */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Placement Office</h3>
              <p className="text-slate-600 text-sm mb-6">
                Oversee campus-wide placement drives, verify student eligibility criteria, maintain recruiter partnerships, and monitor analytics.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time Analytics Dashboard</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Centralized Company Registry</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Eligibility Checks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 sm:p-14 text-white shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to start your placement journey?</h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8 text-base sm:text-lg">
            Join thousands of students and leading organizations using our portal for campus recruitment drives.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 bg-blue-800/60 hover:bg-blue-800 text-white font-bold rounded-xl border border-blue-400/30 transition-all"
            >
              Sign In To Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>&copy; {new Date().getFullYear()} PlaceMentor Student Placement Portal. All rights reserved.</div>
          <div className="flex space-x-6">
            <Link href="/login" className="hover:text-slate-800">Login</Link>
            <Link href="/register" className="hover:text-slate-800">Register</Link>
            <Link href="/dashboard" className="hover:text-slate-800">Portal Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
