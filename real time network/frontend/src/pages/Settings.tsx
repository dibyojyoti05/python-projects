
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-medium text-neutral-200 mb-6 flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2 text-neutral-400" />
          System Settings
        </h3>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Monitoring Interval (Seconds)</label>
            <input type="number" defaultValue={5} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-neutral-200" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Latency Threshold (ms)</label>
            <input type="number" defaultValue={100} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-neutral-200" disabled />
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium transition-colors opacity-50 cursor-not-allowed">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
