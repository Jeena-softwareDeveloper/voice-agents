'use client';

import React, { useState, useMemo } from 'react';
import { EmptyState } from '../empty-states/EmptyState';
import { DropdownMenu } from '../dropdowns/DropdownMenu';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  CheckSquare,
  Square,
  MinusSquare,
  ArrowUpDown,
  MoreVertical,
} from 'lucide-react';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  defaultVisible?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  // Selection
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId?: (row: T) => string;
  // Bulk Actions
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedIds: string[]) => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  // Sizing & Height
  maxHeight?: string;
  // Mobile Card Renderer (Alternative to standard table on mobile devices)
  renderMobileCard?: (row: T, isSelected: boolean, toggleSelect: () => void) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  emptyAction,
  onRowClick,
  enableSelection = false,
  selectedIds = [],
  onSelectionChange,
  getRowId = (row) => row.id,
  bulkActions = [],
  maxHeight = 'max-h-[calc(100vh-320px)]',
  renderMobileCard,
}: DataTableProps<T>) {
  // Column visibility state
  const [visibleColIds, setVisibleColIds] = useState<Set<string>>(() => {
    return new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.id));
  });

  // Sorting state
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(25);
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    const col = columns.find((c) => c.id === sortCol);
    if (!col || !col.accessorKey) return data;

    return [...data].sort((a, b) => {
      const valA = a[col.accessorKey!];
      const valB = b[col.accessorKey!];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      return sortDir === 'asc' ? 1 : -1;
    });
  }, [data, sortCol, sortDir, columns]);

  // Paginated slice
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageData = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  // Selection helpers
  const currentPageIds = useMemo(() => {
    return currentPageData.map((row) => getRowId(row));
  }, [currentPageData, getRowId]);

  const allCurrentSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
  const someCurrentSelected =
    currentPageIds.some((id) => selectedIds.includes(id)) && !allCurrentSelected;

  const toggleSelectAllCurrentPage = () => {
    if (!onSelectionChange) return;
    if (allCurrentSelected) {
      onSelectionChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    } else {
      const newSet = new Set([...selectedIds, ...currentPageIds]);
      onSelectionChange(Array.from(newSet));
    }
  };

  const toggleRowSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colId);
      setSortDir('asc');
    }
  };

  const toggleColumnVisibility = (colId: string) => {
    setVisibleColIds((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) {
        if (next.size > 1) next.delete(colId);
      } else {
        next.add(colId);
      }
      return next;
    });
  };

  const activeColumns = columns.filter((c) => visibleColIds.has(c.id));

  // Skeleton rows for enterprise loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="h-10 bg-slate-50/80 border-b border-slate-200 flex items-center px-4 gap-4 animate-pulse">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="w-24 h-3 bg-slate-200 rounded" />
          <div className="w-20 h-3 bg-slate-200 rounded" />
          <div className="w-20 h-3 bg-slate-200 rounded" />
          <div className="w-28 h-3 bg-slate-200 rounded" />
          <div className="w-16 h-3 bg-slate-200 rounded ml-auto" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-13 px-4 flex items-center gap-4 animate-pulse">
              <div className="w-4 h-4 bg-slate-100 rounded" />
              <div className="space-y-1.5 w-44">
                <div className="h-3.5 bg-slate-100 rounded w-32" />
                <div className="h-2.5 bg-slate-50 rounded w-20" />
              </div>
              <div className="w-24 h-4 bg-slate-100 rounded" />
              <div className="w-20 h-5 bg-slate-100 rounded-md" />
              <div className="w-24 h-5 bg-slate-100 rounded-md" />
              <div className="w-28 h-3 bg-slate-50 rounded" />
              <div className="w-16 h-6 bg-slate-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Bulk Actions Header (Only when rows selected) */}
      {enableSelection && selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs transition-all">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-semibold text-blue-300">
              {selectedIds.length} {selectedIds.length === 1 ? 'selected' : 'selected'}
            </span>
            <span className="text-slate-500">•</span>
            <button
              onClick={() => onSelectionChange && onSelectionChange([])}
              className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors font-medium text-caption"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.onClick(selectedIds)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-caption sm:text-xs font-semibold transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : action.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE VIEW: Touch-Friendly Structured Cards (< md) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {/* Mobile select-all bar */}
        {enableSelection && (
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <button
              onClick={toggleSelectAllCurrentPage}
              className="flex items-center gap-2 font-medium"
            >
              {allCurrentSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select all {currentPageData.length} records</span>
            </button>
            <span className="text-caption text-slate-400">Page {pageIndex + 1}</span>
          </div>
        )}

        {currentPageData.map((row, index) => {
          const rowId = getRowId(row);
          const isSelected = selectedIds.includes(rowId);

          if (renderMobileCard) {
            return (
              <div key={rowId || index} className="p-3">
                {renderMobileCard(row, isSelected, () => toggleRowSelect(rowId))}
              </div>
            );
          }

          // Default Mobile Card layout
          return (
            <div
              key={rowId || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={`p-3.5 space-y-2.5 transition-colors ${
                isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'
              } ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {enableSelection && (
                    <button
                      type="button"
                      onClick={(e) => toggleRowSelect(rowId, e)}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  )}
                  {columns[0] && (
                    <div>{columns[0].cell ? columns[0].cell(row) : String(row[columns[0].accessorKey!] || '')}</div>
                  )}
                </div>
                {/* Actions column if last column is 'actions' */}
                {columns[columns.length - 1]?.id === 'actions' && (
                  <div className="shrink-0">{columns[columns.length - 1].cell?.(row)}</div>
                )}
              </div>

              {/* Card Meta Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-100">
                {activeColumns.slice(1, columns[columns.length - 1]?.id === 'actions' ? -1 : undefined).map((col) => (
                  <div key={col.id} className="min-w-0">
                    <span className="text-caption font-semibold text-slate-500 block truncate">
                      {col.header}
                    </span>
                    <div className="mt-0.5 truncate text-label text-slate-800">
                      {col.cell ? col.cell(row) : String(row[col.accessorKey!] || '—')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP / TABLET VIEW: Sticky-Header Data Table (>= md) */}
      <div className={`hidden md:block overflow-x-auto overflow-y-auto ${maxHeight} relative w-full scrollbar-thin`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold tracking-wider uppercase text-caption sticky top-0 z-10 border-b border-slate-200 select-none shadow-xs">
            <tr>
              {/* Checkbox column */}
              {enableSelection && (
                <th scope="col" className="w-10 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={toggleSelectAllCurrentPage}
                    className="text-slate-500 hover:text-slate-800 focus:outline-none flex items-center"
                    title={allCurrentSelected ? 'Deselect all' : 'Select all on page'}
                  >
                    {allCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : someCurrentSelected ? (
                      <MinusSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </th>
              )}

              {/* Dynamic Header Columns */}
              {activeColumns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  style={{ width: col.width }}
                  className={`px-3.5 py-2.5 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                  } ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end' : ''
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={`w-3 h-3 transition-colors ${
                          sortCol === col.id ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {currentPageData.map((row, index) => {
              const rowId = getRowId(row);
              const isSelected = selectedIds.includes(rowId);

              return (
                <tr
                  key={rowId || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {/* Row Checkbox */}
                  {enableSelection && (
                    <td className="w-10 px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => toggleRowSelect(rowId, e)}
                        className="text-slate-400 hover:text-blue-600 flex items-center justify-center"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>
                  )}

                  {/* Cell Data */}
                  {activeColumns.map((col) => {
                    const value = col.accessorKey ? row[col.accessorKey] : undefined;
                    return (
                      <td
                        key={col.id}
                        className={`px-3.5 py-2.5 text-slate-700 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.cell ? col.cell(row) : String(value ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination & Summary Footer: Desktop/Tablet View (>= md) */}
      <div className="hidden md:flex px-3.5 py-2.5 bg-slate-50 border-t border-slate-200/80 items-center justify-between gap-2.5 text-xs text-slate-500">
        {/* Left: Record Range Summary + Rows per page */}
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <strong className="text-slate-800">
              {totalRecords === 0 ? 0 : pageIndex * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(totalRecords, (pageIndex + 1) * pageSize)}
            </strong>{' '}
            of <strong className="text-slate-800">{totalRecords}</strong>
          </span>

          <div className="flex items-center gap-1.5 text-caption">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Column Visibility Dropdown & Page Navigation */}
        <div className="flex items-center gap-2">
          {/* Column Visibility Toggler */}
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                title="Toggle Columns"
              >
                <Columns3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns</span>
              </button>
            }
            items={columns.map((c) => ({
              label: `${visibleColIds.has(c.id) ? '✓ ' : '   '}${c.header}`,
              onClick: () => toggleColumnVisibility(c.id),
            }))}
            align="right"
          />

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-caption font-medium text-slate-700 px-2 whitespace-nowrap">
              Page {pageIndex + 1} of {totalPages}
            </span>

            <button
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pagination & Summary Footer: Mobile Clean View (< md) */}
      <div className="flex md:hidden px-3.5 py-2.5 bg-slate-50 border-t border-slate-200/80 items-center justify-between text-xs text-slate-600">
        <span>
          Showing <strong className="text-slate-900">{totalRecords === 0 ? 0 : pageIndex * pageSize + 1}–{Math.min(totalRecords, (pageIndex + 1) * pageSize)}</strong> of <strong className="text-slate-900">{totalRecords}</strong>
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-30 text-xs font-semibold"
            >
              Prev
            </button>
            <span className="text-caption font-medium text-slate-600">
              {pageIndex + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-30 text-xs font-semibold"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
