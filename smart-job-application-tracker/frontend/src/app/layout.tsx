import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Job Application Tracker",
  description: "Automated job application tracking platform with real-time discovery and Kanban board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0A0A] text-gray-100 flex h-screen overflow-hidden`}>
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto bg-[#0A0A0A]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

