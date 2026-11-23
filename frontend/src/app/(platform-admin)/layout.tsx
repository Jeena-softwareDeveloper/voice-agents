'use client';

import React from 'react';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { PlatformMobileNavbar } from '@/components/layout/PlatformMobileNavbar';
import { ToastProvider } from '@/components/common/feedback/Toast';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-slate-50/70">
        <PlatformMobileNavbar />
        <PlatformSidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full p-3 sm:p-4 lg:p-6 bg-slate-50/70">
          <div className="w-full max-w-full min-w-0">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
