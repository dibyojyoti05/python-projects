
import { Radio } from 'lucide-react';

export default function Devices() {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-medium text-neutral-200 mb-6 flex items-center">
          <Radio className="w-5 h-5 mr-2 text-neutral-400" />
          Connected Devices
        </h3>
        
        <div className="p-8 text-center text-neutral-500">
          Device discovery module must be run with Administrator privileges to populate this data via ARP.
        </div>
      </div>
    </div>
  );
}
