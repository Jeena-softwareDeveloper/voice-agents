'use client';

import React, { useState } from 'react';
import { ClientSidebar } from '@/components/layout/ClientSidebar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { GuidedTour } from '@/components/onboarding/GuidedTour';
import { ToastProvider } from '@/components/common/feedback/Toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTourOpen, setIsTourOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-slate-50/70">
        {/* Mobile Top Navbar (Visible on screens < md) */}
        <MobileNavbar onOpenTour={() => setIsTourOpen(true)} />

        {/* Desktop / Tablet Sidebar (Collapsible on tablet, strictly hidden on mobile) */}
        <ClientSidebar onOpenTour={() => setIsTourOpen(true)} />

        {/* Main Content Area (100% width on mobile, no sidebar margin) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full p-3 sm:p-4 lg:p-6 bg-slate-50/70">
          <div className="w-full max-w-full min-w-0">{children}</div>
        </main>

        {/* Guided Onboarding Walkthrough */}
        <GuidedTour
          forceOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
