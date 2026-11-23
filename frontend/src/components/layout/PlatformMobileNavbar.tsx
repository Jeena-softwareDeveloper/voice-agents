'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  PhoneCall,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { clearAuth } from '@/lib/api/interceptors';

export const PlatformMobileNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

  const currentNav = navItems.find((item) => pathname.startsWith(item.href)) || {
    label: 'Platform Admin',
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 h-13 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3.5 text-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open admin navigation menu"
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate leading-tight">
                {currentNav.label}
              </span>
              <span className="text-micro text-slate-400 block truncate leading-none mt-0.5">
                ACRM Super Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 flex flex-col h-full shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">ACRM Admin</div>
                  <div className="text-micro text-blue-400 font-medium">Platform Administration</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              <div className="px-2 pb-1 text-micro uppercase font-semibold text-slate-400 tracking-wider">
                Admin Operations
              </div>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-800 bg-slate-950/70">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-900/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
