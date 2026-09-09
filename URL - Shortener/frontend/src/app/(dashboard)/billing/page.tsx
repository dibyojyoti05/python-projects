"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { CreditCard, Check, Zap, Building2, AlertTriangle } from "lucide-react";

export default function BillingPage() {
  const { activeOrgId } = useAuthStore();
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrgId) {
      fetchBilling();
    }
  }, [activeOrgId]);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/billing/${activeOrgId}`);
      setBillingInfo(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      // Mock Stripe upgrade
      await api.post("/billing/upgrade", {
        organization_id: activeOrgId,
        tier
      });
      fetchBilling();
      alert(`Successfully upgraded to ${tier.toUpperCase()} tier!`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upgrade");
    }
  };

  if (!activeOrgId) return <div className="p-8 text-center">Loading billing context...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <CreditCard className="text-indigo-600" size={32} />
          Billing & Usage
        </h1>
        <p className="text-gray-500 mt-2">Manage your subscription, view quotas, and update payment methods.</p>
      </div>

      {/* Current Plan Overview */}
      {billingInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Current Plan: <span className="uppercase text-indigo-600 dark:text-indigo-400">{billingInfo.tier}</span></h3>
            <p className="text-sm text-gray-500">
              Your organization can generate up to {billingInfo.limits.max_links === -1 ? 'unlimited' : billingInfo.limits.max_links} links.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
             {billingInfo.tier === "free" && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm font-medium border border-amber-200">
                  <AlertTriangle size={16} /> Upgrade to unlock API access
                </div>
             )}
          </div>
        </div>
      )}

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Free Tier */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl border p-8 relative ${billingInfo?.tier === 'free' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
          {billingInfo?.tier === 'free' && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Current Plan</span>}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hobby</h3>
          <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">$0<span className="text-lg font-normal text-gray-500">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> Up to 100 Links</li>
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> Basic Analytics</li>
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> 2 Campaigns</li>
            <li className="flex items-center gap-3 text-sm text-gray-400 opacity-50 line-through"><Check size={18} /> API Access</li>
          </ul>
          <button 
            disabled={billingInfo?.tier === 'free'}
            className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium disabled:opacity-50"
          >
            {billingInfo?.tier === 'free' ? 'Active' : 'Downgrade'}
          </button>
        </div>

        {/* Pro Tier */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl border p-8 relative shadow-lg ${billingInfo?.tier === 'pro' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
          {billingInfo?.tier === 'pro' && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Current Plan</span>}
          <div className="flex justify-between items-start">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Zap className="text-amber-500" size={20} /> Pro</h3>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">$29<span className="text-lg font-normal text-gray-500">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> Up to 5,000 Links</li>
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> Advanced Analytics</li>
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> 50 Campaigns</li>
            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><Check className="text-green-500" size={18} /> API Access</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('pro')}
            disabled={billingInfo?.tier === 'pro'}
            className={`w-full py-2.5 rounded-lg font-medium transition ${billingInfo?.tier === 'pro' ? 'border border-gray-300 opacity-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
          >
            {billingInfo?.tier === 'pro' ? 'Active' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Enterprise Tier */}
        <div className={`bg-gray-900 rounded-xl border p-8 relative shadow-lg ${billingInfo?.tier === 'enterprise' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-800'}`}>
          {billingInfo?.tier === 'enterprise' && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Current Plan</span>}
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Building2 className="text-indigo-400" size={20} /> Enterprise</h3>
          <div className="text-4xl font-extrabold text-white mb-6">$99<span className="text-lg font-normal text-gray-400">/mo</span></div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check className="text-green-400" size={18} /> Unlimited Links</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check className="text-green-400" size={18} /> Dedicated Support</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check className="text-green-400" size={18} /> Unlimited Campaigns</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check className="text-green-400" size={18} /> Unlimited API Access</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('enterprise')}
            disabled={billingInfo?.tier === 'enterprise'}
            className={`w-full py-2.5 rounded-lg font-medium transition ${billingInfo?.tier === 'enterprise' ? 'border border-gray-700 text-white opacity-50' : 'bg-white hover:bg-gray-100 text-gray-900 shadow-md'}`}
          >
            {billingInfo?.tier === 'enterprise' ? 'Active' : 'Upgrade to Enterprise'}
          </button>
        </div>

      </div>
    </div>
  );
}
