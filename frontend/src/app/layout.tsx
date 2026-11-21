import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ACRM - Enterprise Multi-Tenant AI CRM',
  description: 'AI-Powered Outbound Calling & Multi-Tenant CRM Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
