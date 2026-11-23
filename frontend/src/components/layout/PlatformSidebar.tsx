'use client';

import React, { useState } from 'react';
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
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { clearAuth } from '@/lib/api/interceptors';

export const PlatformSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Clients', href: '/admin/clients', icon: Building2 },
    { label: 'Calls', href: '/admin/calls', icon: PhoneCall },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className={`desktop-sidebar hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-slate-900 text-slate-300 border-r border-slate-800/80 select-none z-20 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 leading-tight">
                ACRM <span className="text-micro bg-blue-500/20 text-blue-400 font-semibold px-1 py-0.2 rounded border border-blue-500/30">Super</span>
              </div>
              <div className="text-micro text-slate-400 font-medium">Platform Admin</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation (Strictly 5 Menus) */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!isCollapsed && (
          <div className="px-2 pb-1.5 text-micro uppercase font-semibold text-slate-400 tracking-wider">
            Platform Operations
          </div>
        )}
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors relative ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-blue-200/60 shrink-0" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60">
        <button
          onClick={handleLogout}
          title="Sign Out Platform Admin"
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-caption font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Sign Out Admin</span>}
        </button>
      </div>
    </aside>
  );
};
