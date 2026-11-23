'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PhoneCall,
  Layers,
  Bot,
  SlidersHorizontal,
  GitBranch,
  CalendarCheck,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { clearAuth } from '@/lib/api/interceptors';

interface ClientSidebarProps {
  onOpenTour?: () => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ onOpenTour }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState<{ companyName: string; userName: string; initials: string }>({
    companyName: 'Workspace',
    userName: 'Administrator',
    initials: 'WS',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const comp = u.tenant?.businessProfile?.businessName || u.tenant?.name || 'Workspace';
        const name = u.fullName || 'Administrator';
        const words = comp.trim().split(/\s+/);
        const inits = words.length > 1
          ? (words[0][0] + words[1][0]).toUpperCase()
          : comp.substring(0, 2).toUpperCase() || 'WS';
        setProfile({ companyName: comp, userName: name, initials: inits });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Strictly 8 main menus for Client CRM
  const navItems = [
    { label: 'Dashboard', href: '/workspace/dashboard', icon: LayoutDashboard },
    { label: 'Calls', href: '/workspace/calls', icon: PhoneCall },
    { label: 'Services', href: '/workspace/services', icon: Layers },
    { label: 'Configuration', href: '/workspace/ai-calling', icon: SlidersHorizontal },
    { label: 'Sales Pipeline', href: '/workspace/sales-pipeline', icon: GitBranch },
    { label: 'Follow-ups', href: '/workspace/follow-ups', icon: CalendarCheck },
    { label: 'Customers', href: '/workspace/customers', icon: Users },
    { label: 'Reports', href: '/workspace/reports', icon: BarChart3 },
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
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
            {profile.initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                {profile.companyName}
              </div>
              <div className="text-micro text-slate-400 flex items-center gap-1 font-medium leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Voice Service Active
              </div>
            </div>
          )}
        </div>

        {/* Tablet collapse toggle button */}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Menus (Strictly 8 Menus) */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!isCollapsed && (
          <div className="px-2 pb-1.5 text-micro uppercase font-semibold text-slate-400 tracking-wider">
            Workspace
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

      {/* Footer: Tour Help & User Sign Out */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        {/* Onboarding Tour Button */}
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            title="Start Guided Onboarding Tour"
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-caption font-medium text-blue-300 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/40 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {!isCollapsed && <span>Guided Tour</span>}
          </button>
        )}

        {!isCollapsed && (
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate leading-tight">{profile.userName}</p>
              <p className="text-micro text-slate-400 truncate">Administrator</p>
            </div>
            <span className="text-micro font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
              Active
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Sign Out Workspace"
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-caption font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
