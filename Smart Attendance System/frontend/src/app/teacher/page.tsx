/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { fetchWithAuth } from '@/lib/api';
import { LogOut, Play, StopCircle, Users, ScanFace } from 'lucide-react';

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  
  const webcamRef = useRef<Webcam>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/attendance/sessions');
      const data = await res.json();
      // Sessions fetching logic is unused, but kept for API structure demonstration
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!activeSession) return;
    try {
      const res = await fetchWithAuth(`/attendance/sessions/${activeSession.id}/records`);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (subjectId: number = 1) => { // Hardcoded subject 1 for demo
    try {
      const res = await fetchWithAuth('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({ subject_id: subjectId })
      });
      const data = await res.json();
      setActiveSession(data);
    } catch (err) {
      console.error(err);
    }
  };

  const captureAndVerify = useCallback(async () => {
    if (webcamRef.current && activeSession) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          const res = await fetchWithAuth(`/attendance/sessions/${activeSession.id}/verify`, {
            method: 'POST',
            body: JSON.stringify({ image_base64: imageSrc })
          });
          const data = await res.json();
          if (data.status === 'success' && data.matches.length > 0) {
            fetchRecords(); // Update records if someone was matched
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [webcamRef, activeSession, fetchRecords]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession) {
      // Poll camera every 1 second
      interval = setInterval(captureAndVerify, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, captureAndVerify]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage classes and live attendance</p>
          </div>
          <button onClick={logout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Controls */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              {!activeSession ? (
                <button 
                  onClick={() => startSession()}
                  className="w-full py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Play size={20} />
                  <span>Start Live Session</span>
                </button>
              ) : (
                <button 
                  onClick={() => setActiveSession(null)}
                  className="w-full py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-xl font-medium shadow-lg shadow-red-500/20 transition-all"
                >
                  <StopCircle size={20} />
                  <span>End Session</span>
                </button>
              )}
            </div>

            {activeSession && (
              <div className="glass p-6 rounded-2xl flex flex-col h-96">
                <h3 className="text-lg font-medium flex items-center space-x-2 mb-4">
                  <Users size={18} className="text-blue-400" />
                  <span>Live Attendees ({records.length})</span>
                </h3>
                <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                  {records.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 animate-fade-in">
                      <span className="font-medium">{r.student_id}</span>
                      <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md uppercase tracking-wider">
                        {r.method}
                      </span>
                    </div>
                  ))}
                  {records.length === 0 && (
                    <div className="text-slate-500 text-sm text-center mt-10">No students scanned yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Camera */}
          <div className="lg:col-span-2">
            <div className="glass p-6 rounded-2xl h-full min-h-[500px] flex flex-col relative overflow-hidden">
              <h2 className="text-xl font-semibold mb-4">Identity Scanner</h2>
              
              {activeSession ? (
                <div className="relative flex-1 rounded-xl overflow-hidden bg-black border-2 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full object-cover"
                  />
                  {/* Scan Line Animation */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <ScanFace size={64} className="mx-auto text-slate-700" />
                    <p className="text-slate-500 font-medium">Start a session to activate the scanner.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
