'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PhoneCall,
  Layers,
  Bot,
  GitBranch,
  CalendarCheck,
  Users,
  BarChart3,
  LogOut,
  Building,
} from 'lucide-react';
import { clearAuth } from '@/lib/api/interceptors';

export const ClientSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Strictly 8 main menus for Client CRM as specified in Part 3
  const navItems = [
    { label: 'Dashboard', href: '/workspace/dashboard', icon: LayoutDashboard },
    { label: 'Calls', href: '/workspace/calls', icon: PhoneCall },
    { label: 'Services', href: '/workspace/services', icon: Layers },
    { label: 'AI Calling', href: '/workspace/ai-calling', icon: Bot },
    { label: 'Sales Pipeline', href: '/workspace/sales-pipeline', icon: GitBranch },
    { label: 'Follow-ups', href: '/workspace/follow-ups', icon: CalendarCheck },
    { label: 'Customers', href: '/workspace/customers', icon: Users },
    { label: 'Reports', href: '/workspace/reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none">
      {/* Client Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-sm">
          <Building className="w-5 h-5" />
        </div>
        <div className="truncate">
          <div className="text-sm font-bold text-white tracking-wide truncate">
            Client Workspace
          </div>
          <div className="text-[11px] text-slate-400 font-medium">AI Telephony CRM</div>
        </div>
      </div>

      {/* Navigation (Strictly 8 Menus) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Workspace Menus
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out Workspace
        </button>
      </div>
    </aside>
  );
};
