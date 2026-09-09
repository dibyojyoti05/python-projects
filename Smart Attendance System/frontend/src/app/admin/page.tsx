/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react/no-unescaped-entities, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Users, BookOpen, BarChart3, Settings, Edit, Check, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [addRecordData, setAddRecordData] = useState({ student_id: '', session_id: '', status: 'present', method: 'manual' });
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      if (parsed.role !== 'admin') {
        router.push('/');
      } else {
        setUser(parsed);
        fetchRecords();
        fetchSessionsAndStudents();
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const fetchSessionsAndStudents = async () => {
    try {
      const [sessionsRes] = await Promise.all([
        fetchWithAuth('/attendance/sessions'),
      ]);
      const sessionData = await sessionsRes.json();
      if (Array.isArray(sessionData)) setSessions(sessionData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetchWithAuth('/attendance/admin/records');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    try {
      await fetchWithAuth(`/attendance/admin/records/${editingRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchRecords();
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  };

  const handleAddRecord = async () => {
    try {
      await fetchWithAuth('/attendance/admin/records', {
        method: 'POST',
        body: JSON.stringify({
          session_id: parseInt(addRecordData.session_id),
          student_id: parseInt(addRecordData.student_id),
          status: addRecordData.status,
          method: addRecordData.method
        }),
      });
      fetchRecords();
      setIsAddingRecord(false);
      setAddRecordData({ student_id: '', session_id: '', status: 'present', method: 'manual' });
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-gradient">SmartAdmin</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Overview', active: true },
            { icon: Users, label: 'Manage Users' },
            { icon: BookOpen, label: 'Classes & Subjects' },
            { icon: BarChart3, label: 'Reports' },
            { icon: Settings, label: 'System Settings' },
          ].map((item, i) => (
            <button 
              key={i} 
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1">Welcome back, {user.name}. Here's what's happening today.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Students', value: '1,248', trend: '+12% this month', color: 'from-blue-500 to-blue-600' },
            { label: 'Active Sessions', value: '24', trend: 'Live right now', color: 'from-emerald-500 to-emerald-600' },
            { label: 'Avg. Attendance', value: '92.4%', trend: '+2.1% from last week', color: 'from-purple-500 to-purple-600' },
            { label: 'Flagged Absences', value: '18', trend: 'Needs review', color: 'from-orange-500 to-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${stat.color} shadow-lg shadow-[var(--tw-gradient-from)]/40`} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-xs text-slate-500">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* Charts/Tables Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass p-6 rounded-2xl min-h-[400px] animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Recent Attendance Records</h3>
              <button 
                onClick={() => setIsAddingRecord(true)}
                className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-600/30 transition-colors"
              >
                Add Manual Record
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="py-3 px-4 text-slate-400 font-medium text-sm">Student</th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-sm">Subject</th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-sm">Date & Time</th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-sm text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">Loading records...</td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">No attendance records found.</td>
                    </tr>
                  ) : (
                    records.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-sm">{r.student_name}</td>
                        <td className="py-3 px-4 text-sm text-slate-300">{r.subject}</td>
                        <td className="py-3 px-4 text-sm text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider ${
                            r.status.toLowerCase() === 'present' ? 'bg-emerald-500/20 text-emerald-400' :
                            r.status.toLowerCase() === 'absent' ? 'bg-red-500/20 text-red-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => { setEditingRecord(r); setNewStatus(r.status); }}
                            className="p-1.5 bg-slate-700/50 text-slate-300 rounded hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl min-h-[400px] animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-lg font-medium mb-6">System Alerts</h3>
            <div className="space-y-4">
              {[
                { title: 'Database Backup Complete', time: '10 mins ago', type: 'success' },
                { title: 'High API Latency Detected', time: '1 hour ago', type: 'warning' },
                { title: 'New Teacher Account Pending', time: '3 hours ago', type: 'info' },
                { title: 'Camera Offline in Room 102', time: '5 hours ago', type: 'error' },
              ].map((alert, i) => (
                <div key={i} className="flex space-x-3">
                  <div className={`w-2 rounded-full ${
                    alert.type === 'success' ? 'bg-emerald-500' :
                    alert.type === 'warning' ? 'bg-orange-500' :
                    alert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-slate-500">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Attendance</h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-1">Student</p>
              <p className="font-medium">{editingRecord.student_name}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-1">Date & Time</p>
              <p className="font-medium">{new Date(editingRecord.timestamp).toLocaleString()}</p>
            </div>
            
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Status</label>
              <select 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateRecord}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Check size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {isAddingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Manual Record</h3>
              <button onClick={() => setIsAddingRecord(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Student ID</label>
              <input 
                type="number"
                value={addRecordData.student_id}
                onChange={(e) => setAddRecordData({...addRecordData, student_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. 1"
              />
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Session ID</label>
              <input 
                type="number"
                value={addRecordData.session_id}
                onChange={(e) => setAddRecordData({...addRecordData, session_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. 1"
              />
            </div>
            
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Status</label>
              <select 
                value={addRecordData.status}
                onChange={(e) => setAddRecordData({...addRecordData, status: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddingRecord(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddRecord}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Check size={16} />
                <span>Add Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
