import {
  useState,
  useMemo,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T | string;
  title: ReactNode;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  width?: string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyText?: ReactNode;
  onRowClick?: (record: T, index: number) => void;
  onSortChange?: (key: string, direction: SortDirection) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  showIndex?: boolean;
  indexTitle?: string;
}

function getRowKey<T>(
  record: T,
  index: number,
  rowKey?: keyof T | ((record: T) => string)
): string {
  if (typeof rowKey === 'function') {
    return rowKey(record);
  }
  if (rowKey && record[rowKey] !== undefined) {
    return String(record[rowKey]);
  }
  return String(index);
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading = false,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  emptyText = '暂无数据',
  onRowClick,
  onSortChange,
  className,
  headerClassName,
  rowClassName,
  showIndex = false,
  indexTitle = '#',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    let newDirection: SortDirection = 'asc';
    if (sortKey === key) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
    }
    setSortKey(newDirection ? key : null);
    setSortDirection(newDirection);
    onSortChange?.(key, newDirection);
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / currentPageSize)
  );

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * currentPageSize;
    return sortedData.slice(start, start + currentPageSize);
  }, [sortedData, currentPage, currentPageSize, pagination]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setCurrentPageSize(newSize);
    setCurrentPage(1);
  };

  const handleRowClick = (record: T, index: number) => {
    onRowClick?.(record, index);
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const renderSortIcon = (col: Column<T>) => {
    if (!col.sortable) return null;
    const key = String(col.key);
    const isActive = sortKey === key;
    if (!isActive) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-dark-500 ml-1.5" />
      );
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-primary-500 ml-1.5" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-primary-500 ml-1.5" />;
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-xl border border-dark-700 bg-dark-800/30 overflow-hidden',
        className
      )}
    >
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse">
          <thead
            className={cn(
              'bg-dark-800/80 border-b border-dark-700',
              headerClassName
            )}
          >
            <tr>
              {showIndex && (
                <th
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-dark-300 uppercase tracking-wider whitespace-nowrap',
                    'text-center w-14'
                  )}
                >
                  {indexTitle}
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-dark-300 uppercase tracking-wider whitespace-nowrap',
                    getAlignClass(col.align),
                    col.sortable && 'cursor-pointer select-none hover:text-white',
                    col.className
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center">
                    {col.title}
                    {renderSortIcon(col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/60">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (showIndex ? 1 : 0)}
                  className="px-4 py-16"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm text-dark-400">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showIndex ? 1 : 0)}
                  className="px-4 py-16"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-dark-500">
                    <svg
                      className="w-12 h-12 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <span className="text-sm">{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((record, idx) => {
                const absoluteIndex = (currentPage - 1) * currentPageSize + idx;
                const rowKeyVal = getRowKey(record, absoluteIndex, rowKey);
                const rowCls =
                  typeof rowClassName === 'function'
                    ? rowClassName(record, absoluteIndex)
                    : rowClassName;
                return (
                  <tr
                    key={rowKeyVal}
                    className={cn(
                      'transition-colors',
                      onRowClick &&
                        'cursor-pointer hover:bg-dark-700/40',
                      rowCls
                    )}
                    onClick={(e: MouseEvent<HTMLTableRowElement>) => {
                      e.stopPropagation();
                      handleRowClick(record, absoluteIndex);
                    }}
                  >
                    {showIndex && (
                      <td className="px-4 py-3 text-center text-sm text-dark-500 font-mono">
                        {absoluteIndex + 1}
                      </td>
                    )}
                    {columns.map((col) => {
                      const dataKey = col.dataIndex ?? (col.key as keyof T);
                      const value = record[dataKey];
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            'px-4 py-3 text-sm text-dark-200 whitespace-nowrap',
                            getAlignClass(col.align),
                            col.className
                          )}
                          style={{ width: col.width }}
                        >
                          {col.render
                            ? col.render(value, record, absoluteIndex)
                            : value !== undefined && value !== null
                            ? String(value)
                            : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-dark-700 bg-dark-800/50">
          <div className="flex items-center gap-3 text-sm text-dark-400">
            <span>
              共 <span className="text-dark-200 font-medium">{sortedData.length}</span> 条
            </span>
            <select
              value={currentPageSize}
              onChange={handlePageSizeChange}
              className="h-8 px-2 rounded-md bg-dark-700 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-sm text-dark-200 font-medium">
                {currentPage}
              </span>
              <span className="text-sm text-dark-500">/</span>
              <span className="text-sm text-dark-400">{totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
