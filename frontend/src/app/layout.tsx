import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ACRM - Enterprise Multi-Tenant AI CRM',
  description: 'AI-Powered Outbound Calling & Multi-Tenant CRM Platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
