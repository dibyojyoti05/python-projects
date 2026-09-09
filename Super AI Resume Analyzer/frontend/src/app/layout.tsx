import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { Navigation } from "@/components/Navigation"; // We'll move Navigation to a separate client component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Resume Intelligence Platform",
  description: "Analyze, Score, and Match Resumes to Jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <AuthProvider>
          <Navigation />
          <main className="flex-1 container mx-auto p-4 md:p-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
