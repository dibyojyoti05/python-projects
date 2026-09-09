"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Users, Plus, Shield, ShieldAlert, Mail, Trash2 } from "lucide-react";

export default function TeamManagementPage() {
  const { activeOrgId, user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (activeOrgId) {
      fetchMembers();
    }
  }, [activeOrgId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/organizations/${activeOrgId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/organizations/${activeOrgId}/members`, {
        email,
        role
      });
      setSuccess(`User ${email} successfully added as ${role}.`);
      setEmail("");
      fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add team member.");
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) return;
    try {
      await api.delete(`/organizations/${activeOrgId}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to remove member");
    }
  };

  if (!activeOrgId) return <div className="p-8 text-center">Loading organization context...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Users className="text-indigo-600" size={32} />
          Team Management
        </h1>
        <p className="text-gray-500 mt-2">Manage access controls and invite collaborators to your organization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Invite Member */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Invite Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
              {success && <div className="text-sm text-green-500 bg-green-50 p-2 rounded">{success}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="member">Member (Can edit links)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <Plus size={16} /> Add Member
              </button>
            </form>
          </div>
        </div>

        {/* Member List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Members</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading members...</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((member) => (
                  <li key={member.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                        {member.email.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{member.full_name || member.email.split('@')[0]}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.role === 'owner' && <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"><ShieldAlert size={12} /> Owner</span>}
                      {member.role === 'admin' && <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200"><Shield size={12} /> Admin</span>}
                      {member.role === 'member' && <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">Member</span>}
                      {member.role === 'viewer' && <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">Viewer</span>}
                      
                      {member.role !== 'owner' && member.id !== user?.id && (
                        <button
                          onClick={() => handleRemove(member.id, member.email)}
                          title="Remove Member"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {members.length === 0 && (
                  <li className="p-8 text-center text-gray-500">No members found.</li>
                )}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
