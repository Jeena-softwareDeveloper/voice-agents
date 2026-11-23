'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/common/buttons/Button';

interface AdvancedFiltersProps {
  onApply: (filters: {
    interestLevel?: string;
    aiEligibleOnly?: boolean;
    dateRange?: string;
  }) => void;
  onClear: () => void;
  activeCount: number;
}

export const AdvancedFiltersPopover: React.FC<AdvancedFiltersProps> = ({
  onApply,
  onClear,
  activeCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [interestLevel, setInterestLevel] = useState('');
  const [aiEligibleOnly, setAiEligibleOnly] = useState(false);
  const [dateRange, setDateRange] = useState('');

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleApply = () => {
    onApply({
      interestLevel: interestLevel || undefined,
      aiEligibleOnly: aiEligibleOnly || undefined,
      dateRange: dateRange || undefined,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setInterestLevel('');
    setAiEligibleOnly(false);
    setDateRange('');
    onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
          activeCount > 0
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-micro flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 rounded-lg bg-white shadow-xl border border-slate-200 p-4 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900">Advanced Filters</span>
            {activeCount > 0 && (
              <button
                onClick={handleReset}
                className="text-caption text-slate-400 hover:text-slate-700 font-medium"
              >
                Reset
              </button>
            )}
          </div>

          <div>
            <label className="block text-caption font-semibold text-slate-600 mb-1">Interest Level</label>
            <select
              value={interestLevel}
              onChange={(e) => setInterestLevel(e.target.value)}
              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="">Any Interest</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-caption font-semibold text-slate-600 mb-1">Time Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="">All Time</option>
              <option value="today">Created Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="aiEligible"
              checked={aiEligibleOnly}
              onChange={(e) => setAiEligibleOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="aiEligible" className="text-caption text-slate-700 select-none cursor-pointer">
              Only AI Calling Eligible Leads
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
