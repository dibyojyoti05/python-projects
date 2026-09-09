/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, QrCode, History, UserCircle, Search, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

interface User {
  id: number;
  name: string;
  qr_code_data?: string;
  [key: string]: any; // fallback
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPerformance = useCallback(async (rollNo: string) => {
    if (!rollNo) return;
    setLoading(true);
    setError('');
    try {
      // For student endpoints we might want an open endpoint or auth endpoint. 
      // Using fetchWithAuth for consistency if they are logged in.
      const res = await fetchWithAuth(`/attendance/student/performance/${rollNo}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.attendance_percentage !== undefined) {
          setPerformanceData(data);
        } else {
          setError('Could not fetch data for this roll number.');
        }
      } else {
        setError('Error fetching attendance data. Roll number might not exist.');
      }
    } catch (err) {
      setError('Error fetching attendance data. Roll number might not exist.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setUser(parsed);
      if (parsed.roll_number) {
        setRollNumberInput(parsed.roll_number);
        fetchPerformance(parsed.roll_number);
      }
    } else {
      router.push('/');
    }
  }, [router, fetchPerformance]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPerformance(rollNumberInput);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  // In production, the QR data comes from the backend user profile
  const qrData = user.qr_code_data || `user-${user.id}-secure-token`;

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <UserCircle size={32} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-slate-400">Student Dashboard</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Roll Number Search */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Check Performance</h2>
            <p className="text-slate-400 text-sm">Enter your roll number to view detailed attendance stats and impact.</p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Enter Roll Number" 
              value={rollNumberInput}
              onChange={(e) => setRollNumberInput(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:border-blue-500 w-full md:w-64"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-r-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Panel: QR Code Identity */}
          <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center animate-slide-up">
            <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400">
              <QrCode size={32} />
            </div>
            <h2 className="text-2xl font-semibold mb-2">My Digital ID</h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              Present this secure QR code to the classroom scanner to mark your attendance instantly.
            </p>
            
            <div className="p-4 bg-white rounded-xl shadow-xl shadow-blue-500/20">
              <QRCodeSVG 
                value={qrData} 
                size={220} 
                level="Q"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Right Panel: Attendance History & Performance */}
          <div className="glass p-8 rounded-2xl animate-fade-in flex flex-col" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <History className="text-blue-400" size={24} />
                <h2 className="text-xl font-semibold">Performance & History</h2>
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">Loading data...</div>
            ) : performanceData ? (
              <div className="space-y-6">
                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">Attendance Rate</p>
                    <p className="text-3xl font-bold text-white">{performanceData.attendance_percentage}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-center">
                    <p className="text-sm text-slate-400 mb-1">Sessions Attended</p>
                    <p className="text-xl font-semibold text-white">{performanceData.present_sessions} / {performanceData.total_sessions}</p>
                  </div>
                </div>

                {/* Impact Analysis */}
                <div className={`p-4 rounded-xl flex items-start space-x-3 ${
                  performanceData.attendance_percentage > 90 ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  performanceData.attendance_percentage > 75 ? 'bg-blue-500/10 border border-blue-500/20' :
                  'bg-orange-500/10 border border-orange-500/20'
                }`}>
                  <TrendingUp className={
                    performanceData.attendance_percentage > 90 ? 'text-emerald-400' :
                    performanceData.attendance_percentage > 75 ? 'text-blue-400' :
                    'text-orange-400'
                  } size={24} />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Impact Analysis</h3>
                    <p className="text-sm text-slate-300">{performanceData.impact_message}</p>
                  </div>
                </div>

                {/* Recent Records */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Recent Activity</h3>
                  <div className="space-y-3">
                    {performanceData.recent_records.length === 0 ? (
                      <p className="text-slate-500 text-sm">No recent attendance records found.</p>
                    ) : (
                      performanceData.recent_records.map((record: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                          <div>
                            <p className="text-sm text-slate-300">{new Date(record.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider mb-1 ${
                              record.status.toLowerCase() === 'present' ? 'bg-emerald-500/20 text-emerald-400' :
                              record.status.toLowerCase() === 'absent' ? 'bg-red-500/20 text-red-400' :
                              'bg-orange-500/20 text-orange-400'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                <BarChart3 size={48} className="text-slate-500 mb-4" />
                <p className="text-slate-400">Enter your roll number above to see your attendance performance and history.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
