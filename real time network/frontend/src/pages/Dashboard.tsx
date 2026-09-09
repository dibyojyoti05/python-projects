import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ActivitySquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NetworkData {
  latency_ms: number;
  packet_loss_percent: number;
  is_online: boolean;
  interfaces: Record<string, {
    bytes_sent: number;
    bytes_received: number;
  }>;
}

interface ChartDataPoint {
  time: string;
  latency: number;
  download: number;
  upload: number;
}

export default function Dashboard() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [history, setHistory] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Initial data load would be REST call here, but let's connect WS
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/network`);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'network_update') {
          setData(payload);
          
          // Calculate total bandwidth in Mbps
          let totalDown = 0;
          let totalUp = 0;
          if (payload.interfaces) {
             Object.values(payload.interfaces).forEach((iface: any) => {
               totalDown += (iface.bytes_received * 8) / 1000000;
               totalUp += (iface.bytes_sent * 8) / 1000000;
             });
          }

          setHistory(prev => {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            const newPoint = {
              time: timeStr,
              latency: payload.latency_ms || 0,
              download: Number(totalDown.toFixed(2)),
              upload: Number(totalUp.toFixed(2))
            };
            const newHistory = [...prev, newPoint];
            if (newHistory.length > 20) newHistory.shift();
            return newHistory;
          });
        }
      } catch (err) {
        console.error("Failed to parse WS msg", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const totalDown = history.length > 0 ? history[history.length - 1].download : 0;
  const totalUp = history.length > 0 ? history[history.length - 1].upload : 0;
  
  // Calculate health score (simple mockup logic for UI demo)
  let healthScore = 100;
  if (data?.latency_ms && data.latency_ms > 100) healthScore -= 10;
  if (data?.packet_loss_percent && data.packet_loss_percent > 0) healthScore -= 20;

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard 
          title="LATENCY" 
          value={data?.latency_ms ? `${data.latency_ms.toFixed(1)} ms` : '--'} 
          icon={<Activity className="text-emerald-500 w-5 h-5" />} 
          status={data?.latency_ms && data.latency_ms > 100 ? 'warning' : 'good'}
        />
        <MetricCard 
          title="PACKET LOSS" 
          value={data?.packet_loss_percent ? `${data.packet_loss_percent.toFixed(1)}%` : '0.0%'} 
          icon={<AlertTriangle className="text-emerald-500 w-5 h-5" />} 
          status={data?.packet_loss_percent && data.packet_loss_percent > 0 ? 'warning' : 'good'}
        />
        <MetricCard 
          title="DOWNLOAD" 
          value={`${totalDown} Mbps`} 
          icon={<ArrowDownToLine className="text-emerald-500 w-5 h-5" />} 
        />
        <MetricCard 
          title="UPLOAD" 
          value={`${totalUp} Mbps`} 
          icon={<ArrowUpFromLine className="text-emerald-500 w-5 h-5" />} 
        />
        <MetricCard 
          title="HEALTH" 
          value={`${healthScore}%`} 
          icon={<ActivitySquare className="text-emerald-500 w-5 h-5" />} 
          status={healthScore < 90 ? 'warning' : 'good'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium text-neutral-200 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-neutral-400" />
            Live Traffic (Mbps)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="time" stroke="#525252" fontSize={12} tickMargin={10} />
                <YAxis stroke="#525252" fontSize={12} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e5e5' }}
                />
                <Area type="monotone" dataKey="download" stroke="#10b981" fillOpacity={1} fill="url(#colorDown)" strokeWidth={2} name="Download" />
                <Area type="monotone" dataKey="upload" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUp)" strokeWidth={2} name="Upload" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium text-neutral-200 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-neutral-400" />
            Latency History (ms)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="time" stroke="#525252" fontSize={12} tickMargin={10} />
                <YAxis stroke="#525252" fontSize={12} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e5e5' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} name="Latency" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, status = 'neutral' }: { title: string, value: string, icon: React.ReactNode, status?: 'good'|'warning'|'critical'|'neutral' }) {
  const statusColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
    neutral: 'text-neutral-100'
  };

  return (
    <div className="glass-panel p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">{title}</span>
        <div className="p-2 bg-neutral-800/50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight ${statusColors[status]}`}>
        {value}
      </div>
    </div>
  );
}
