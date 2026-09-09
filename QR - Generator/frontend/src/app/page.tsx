"use client";

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import QRStudio from '@/components/QRStudio';
import QRDashboard from '@/components/QRDashboard';
import QRAnalytics from '@/components/QRAnalytics';
import CampaignsView from '@/components/CampaignsView';
import BulkGenerator from '@/components/BulkGenerator';
import { QrCode, ExternalLink } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'studio' | 'dashboard' | 'analytics' | 'campaigns' | 'bulk'>('studio');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [analyticsSelectedQrId, setAnalyticsSelectedQrId] = useState<string>('');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'studio' && (
          <QRStudio
            onSuccessSave={() => setActiveTab('dashboard')}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
        {activeTab === 'dashboard' && (
          <QRDashboard
            onSelectAnalytics={(id) => {
              setAnalyticsSelectedQrId(id);
              setActiveTab('analytics');
            }}
            onNavigateStudio={() => setActiveTab('studio')}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
        {activeTab === 'analytics' && (
          <QRAnalytics
            selectedQrId={analyticsSelectedQrId}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
        {activeTab === 'campaigns' && (
          <CampaignsView onOpenAuth={() => setAuthModalOpen(true)} />
        )}
        {activeTab === 'bulk' && <BulkGenerator />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">Enterprise QR Platform</span>
            <span>—</span>
            <span>Commercial-Grade Dynamic QR Solution</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-400 transition-colors flex items-center space-x-1"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="flex items-center space-x-1 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Backend Connected (Port 5433)</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
