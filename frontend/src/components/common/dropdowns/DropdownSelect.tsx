'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownSelectProps {
  label?: string;
  options: DropdownSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  required?: boolean;
  id?: string;
}

export const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  error,
  helperText,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  required = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = id || `dropdown-${Math.random().toString(36).substring(2, 9)}`;

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-800 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-lg border bg-white transition-all text-left outline-none focus:outline-none ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-75' : 'text-slate-800'} ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal' : 'text-slate-800 font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[11px] text-slate-400 font-normal shrink-0">
              {selectedOption.sublabel}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Options */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-xl py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center italic">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-blue-50/80 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className={`text-[11px] ${isSelected ? 'text-blue-500/80' : 'text-slate-400'} font-normal`}>
                            {opt.sublabel}
                          </span>
                        )}
                        {opt.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className={`text-[10px] ${isSelected ? 'text-blue-600/70' : 'text-slate-400'} font-normal mt-0.5 line-clamp-1`}>
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-caption text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
