
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, Server, Radio, ShieldAlert, Settings } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Interfaces', path: '/interfaces', icon: Server },
    { name: 'Devices', path: '/devices', icon: Radio },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <Activity className="w-6 h-6 text-emerald-500 mr-3" />
          <span className="font-bold text-lg tracking-wide">NETWORKPULSE</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-8 bg-neutral-900/20 backdrop-blur-md">
          <h1 className="text-xl font-semibold">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              <span className="text-emerald-500 font-medium tracking-wide">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
