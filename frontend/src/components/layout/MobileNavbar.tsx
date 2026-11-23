'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
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
  Sparkles,
  HelpCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import { clearAuth } from '@/lib/api/interceptors';

interface MobileNavbarProps {
  onOpenTour: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ onOpenTour }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{ companyName: string; userName: string; email: string; initials: string }>({
    companyName: 'Workspace',
    userName: 'Administrator',
    email: 'admin@company.com',
    initials: 'WS',
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const comp = u.tenant?.businessProfile?.businessName || u.tenant?.name || 'Workspace';
        const name = u.fullName || 'Administrator';
        const mail = u.email || 'admin@company.com';
        const words = comp.trim().split(/\s+/);
        const inits = words.length > 1
          ? (words[0][0] + words[1][0]).toUpperCase()
          : comp.substring(0, 2).toUpperCase() || 'WS';
        setProfile({ companyName: comp, userName: name, email: mail, initials: inits });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Close drawer on Escape key and prevent body scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsProfileOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Strictly 6 client menus
  const navItems = [
    { label: 'Dashboard', href: '/workspace/dashboard', icon: LayoutDashboard },
    { label: 'Calls', href: '/workspace/calls', icon: PhoneCall },
    { label: 'Services', href: '/workspace/services', icon: Layers },
    { label: 'Configuration', href: '/workspace/ai-calling', icon: SlidersHorizontal },
    { label: 'Follow-ups', href: '/workspace/follow-ups', icon: CalendarCheck },
    { label: 'Reports', href: '/workspace/reports', icon: BarChart3 },
  ];

  // Active navigation menu determination
  const currentNav = navItems.find((item) => pathname.startsWith(item.href)) || {
    label: 'Workspace',
  };

  return (
    <>
      {/* Compact Top Mobile Header (Fixed at top of screen on mobile < md) */}
      <header className="md:hidden sticky top-0 z-30 h-13 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 text-white shrink-0 shadow-xs">
        {/* Left: Hamburger menu + Company logo + Short company name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs">
              {profile.initials}
            </div>
            <div className="min-w-0">
              <span className="text-label font-bold text-white block truncate leading-tight">
                {profile.companyName}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tour Help button + User Avatar dropdown action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenTour}
            aria-label="Start guided tour"
            title="Start Guided Onboarding Walkthrough"
            className="flex items-center gap-1 text-caption font-semibold text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 px-2 py-1 rounded-md transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline">Tour</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="User account menu"
              className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-caption hover:border-slate-500 transition-colors"
            >
              {profile.initials}
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 bg-slate-900 rounded-lg shadow-xl border border-slate-800 py-1.5 text-xs z-50 animate-in fade-in zoom-in-95"
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-800">
                  <p className="font-bold text-white truncate">{profile.userName}</p>
                  <p className="text-micro text-slate-400 truncate">{profile.email}</p>
                </div>
                <button
                  onClick={onOpenTour}
                  className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  Guided Tour
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 border-t border-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer (Overlay on Mobile < md) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Backdrop overlay (tap to close) */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 flex flex-col h-full shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  {profile.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{profile.companyName}</div>
                  <div className="text-micro text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Voice Service Active
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menus (8 Menus) */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              <div className="px-2 pb-1 text-micro uppercase font-semibold text-slate-400 tracking-wider">
                Workspace Navigation
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
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-800/80 mt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenTour();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Start Guided Onboarding Tour</span>
                </button>
              </div>
            </nav>

            {/* Drawer Footer (User & Logout) */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/70 shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Jayant Joshi</p>
                  <p className="text-micro text-slate-400 truncate">Administrator</p>
                </div>
                <span className="text-micro font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Active
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-900/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
