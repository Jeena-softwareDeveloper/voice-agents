'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  PhoneCall,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { clearAuth } from '@/lib/api/interceptors';

export const PlatformSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Strictly 5 main menus for Platform Admin as specified in Part 2
  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Clients', href: '/admin/clients', icon: Building2 },
    { label: 'Calls', href: '/admin/calls', icon: PhoneCall },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            ACRM <span className="text-[10px] bg-brand-500/20 text-brand-400 font-semibold px-1.5 py-0.5 rounded border border-brand-500/30">Admin</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Enterprise Super Admin</div>
        </div>
      </div>

      {/* Navigation (Strictly 5 Menus) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Platform Controls
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <p className="text-[11px] font-medium text-slate-200">Sarvam AI Active</p>
            <p className="text-[10px] text-slate-400">Multi-Circle Telephony</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out Admin
        </button>
      </div>
    </aside>
  );
};
