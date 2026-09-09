import { useEffect, useState } from 'react';
import { Server } from 'lucide-react';

export default function Interfaces() {
  const [interfaces, setInterfaces] = useState([]);

  useEffect(() => {
    // In a real app we'd fetch from REST API, but let's connect WS for live data
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/network`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'network_update' && payload.interfaces) {
           const mapped = Object.keys(payload.interfaces).map(name => ({
             name,
             ...payload.interfaces[name]
           }));
           setInterfaces(mapped as any);
        }
      } catch (err) {}
    };
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-medium text-neutral-200 mb-6 flex items-center">
          <Server className="w-5 h-5 mr-2 text-neutral-400" />
          Network Interfaces
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs uppercase bg-neutral-800/50 text-neutral-400">
              <tr>
                <th className="px-6 py-3">Interface</th>
                <th className="px-6 py-3">Rx (Mbps)</th>
                <th className="px-6 py-3">Tx (Mbps)</th>
                <th className="px-6 py-3">Drops</th>
                <th className="px-6 py-3">Errors</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map((iface: any) => (
                <tr key={iface.name} className="border-b border-neutral-800">
                  <td className="px-6 py-4 font-medium text-neutral-200">{iface.name}</td>
                  <td className="px-6 py-4">{((iface.bytes_received * 8) / 1000000).toFixed(2)}</td>
                  <td className="px-6 py-4">{((iface.bytes_sent * 8) / 1000000).toFixed(2)}</td>
                  <td className="px-6 py-4">{iface.drops_in + iface.drops_out}</td>
                  <td className="px-6 py-4">{iface.errors_in + iface.errors_out}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {interfaces.length === 0 && (
            <div className="p-8 text-center text-neutral-500">Waiting for data...</div>
          )}
        </div>
      </div>
    </div>
  );
}
