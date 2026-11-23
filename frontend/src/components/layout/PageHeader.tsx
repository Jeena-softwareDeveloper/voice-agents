'use client';

import React from 'react';
import { InfoTooltip } from '@/components/common/tooltips/InfoTooltip';

export interface PageHeaderProps {
  title: string;
  description?: string;
  recordCount?: number | string;
  recordLabel?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Explanatory info tooltip for beginner users */
  infoTooltip?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  recordCount,
  recordLabel = 'records',
  actions,
  breadcrumbs,
  infoTooltip,
}) => {
  return (
    <div className="mb-3.5 pb-2.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      {/* Left: Breadcrumbs + Title + Info Icon + Counter + Subtitle */}
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-caption text-slate-400 mb-1">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-300">/</span>}
                {b.href ? (
                  <a href={b.href} className="hover:text-slate-600 transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-slate-600 font-medium">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>

          {infoTooltip && (
            <InfoTooltip
              content={infoTooltip}
              title={title}
              placement="right"
              size="sm"
              className="text-slate-400 hover:text-blue-600"
            />
          )}

          {recordCount !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold bg-slate-100 text-slate-600 border border-slate-200/70">
              {recordCount} {recordLabel}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-xs sm:text-label text-slate-500 leading-normal max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {/* Right: Actions row (Responsive wrapping) */}
      {actions && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
