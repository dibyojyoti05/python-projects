"use client";

import { Users, Camera, FileText, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { name: "Total Personnel", value: "1,248", icon: Users, color: "text-blue-500" },
    { name: "Active Cameras", value: "12", icon: Camera, color: "text-emerald-500" },
    { name: "Recognized Today", value: "842", icon: FileText, color: "text-purple-500" },
    { name: "Unknown Visitors", value: "3", icon: AlertTriangle, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-gray-400 mt-1">Monitor real-time security and attendance statistics.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-sm hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`p-4 bg-gray-800/50 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-gray-500">
          <p>Attendance Chart Placeholder (Recharts)</p>
        </div>
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-gray-500">
          <p>Live Camera Feed Placeholder (WebSocket)</p>
        </div>
      </div>
    </div>
  );
}
