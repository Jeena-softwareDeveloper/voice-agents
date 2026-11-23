'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';

export interface InfoTooltipProps {
  /** Short or detailed explanatory text */
  content: React.ReactNode;
  /** Optional title for the tooltip */
  title?: string;
  /** Visual variant: 'info' (default) or 'help' */
  variant?: 'info' | 'help';
  /** Icon size in pixels */
  size?: 'xs' | 'sm' | 'md';
  /** Preferred placement: top, bottom, left, right */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional custom class for the trigger icon */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  variant = 'info',
  size = 'sm',
  placement = 'top',
  className = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMouseEnter = () => {
    // Check if device supports hover (desktop)
    if (window.matchMedia('(hover: hover)').matches) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const IconComponent = variant === 'help' ? HelpCircle : Info;

  // Placement positioning classes
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel || title || 'More information'}
        aria-expanded={isOpen}
        className={`inline-flex items-center justify-center text-slate-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors cursor-pointer p-0.5 rounded-full hover:bg-slate-100 ${className}`}
      >
        <IconComponent className={`${iconSizes[size]} shrink-0`} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 ${placementClasses[placement]} w-64 max-w-[calc(100vw-32px)] p-2.5 bg-slate-900 text-slate-100 rounded-lg shadow-xl text-xs font-normal border border-slate-700/80 leading-relaxed animate-in fade-in zoom-in-95 duration-150`}
        >
          {title && (
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/70">
              <span className="font-semibold text-caption text-white uppercase tracking-wider">
                {title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="text-caption text-slate-200">{content}</div>
        </div>
      )}
    </div>
  );
};
