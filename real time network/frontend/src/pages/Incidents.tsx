
import { ShieldAlert } from 'lucide-react';

export default function Incidents() {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-medium text-neutral-200 mb-6 flex items-center">
          <ShieldAlert className="w-5 h-5 mr-2 text-neutral-400" />
          Recent Incidents
        </h3>
        
        <div className="p-8 text-center text-neutral-500">
          No incidents detected. System is running smoothly.
        </div>
      </div>
    </div>
  );
}
