'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Users, FileText, Settings, LogOut, Activity, DollarSign } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    const navigation = [
        { name: 'Dashboard', href: `/dashboard/${user?.role.toLowerCase()}`, icon: LayoutDashboard, roles: ['PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST'] },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['PATIENT', 'DOCTOR', 'RECEPTIONIST'] },
        { name: 'Patients', href: '/dashboard/patients', icon: Users, roles: ['DOCTOR', 'RECEPTIONIST', 'ADMIN'] },
        { name: 'Records', href: '/dashboard/records', icon: Activity, roles: ['PATIENT', 'DOCTOR'] },
        { name: 'Billing', href: '/dashboard/billing', icon: DollarSign, roles: ['PATIENT', 'RECEPTIONIST', 'ADMIN'] },
        { name: 'Documents', href: '/dashboard/documents', icon: FileText, roles: ['PATIENT', 'DOCTOR'] },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST'] },
    ];

    const filteredNav = navigation.filter(nav => nav.roles.includes(user?.role || ''));

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
                <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <span className="text-xl font-bold text-blue-600 tracking-tight">MedPro System</span>
                    </div>
                    <div className="mt-8 flex-1 flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {filteredNav.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                >
                                    <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">{user?.role.toLowerCase()}</p>
                                </div>
                                <button onClick={logout} className="ml-auto text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <div className="py-6 px-4 sm:px-6 md:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
