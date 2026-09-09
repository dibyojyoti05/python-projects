"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="font-bold text-xl tracking-tight text-primary">
          ResumeAI
        </Link>
        <div className="flex items-center gap-6">
          {user && (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/resumes/upload" className="text-sm font-medium hover:text-primary transition-colors">Upload</Link>
              <Link href="/job-match" className="text-sm font-medium hover:text-primary transition-colors">Job Match</Link>
              <Link href="/matches" className="text-sm font-medium hover:text-primary transition-colors">Matches</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!loading && !user && (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
              <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Sign Up</Link>
            </>
          )}
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
