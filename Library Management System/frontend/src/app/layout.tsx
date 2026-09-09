import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AIAssistantModal from '@/components/AIAssistantModal';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LiberTech - Enterprise Library & Lending Platform',
  description: 'Next-generation library management, cataloging, circulation, and digital lending system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 flex h-screen overflow-hidden antialiased`}>
        <AuthProvider>
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 bg-slate-900/60 rounded-tl-2xl border-t border-l border-slate-800">
              {children}
            </main>
          </div>
          <AIAssistantModal />
        </AuthProvider>
      </body>
    </html>
  );
}
