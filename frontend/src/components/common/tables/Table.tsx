import React from 'react';
import { Spinner } from '../loaders/Spinner';
import { EmptyState } from '../empty-states/EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  maxHeight?: string;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records to display matching your criteria.',
  onRowClick,
  maxHeight = 'max-h-[640px]',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-xs">
        <Spinner label="Loading records..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`overflow-x-auto overflow-y-auto ${maxHeight} rounded-lg border border-slate-200 bg-white shadow-xs relative`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-xs">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`px-4 py-3 whitespace-nowrap ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors hover:bg-slate-50/80 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`px-4 py-3 whitespace-nowrap ${col.className || ''}`}>
                  {col.cell
                    ? col.cell(row)
                    : col.accessorKey
                    ? String(row[col.accessorKey] ?? '-')
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
