import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from '@repo/utils/icons';
import { cx } from '../utils/cva.config';
import { Pagination } from './Pagination';

export interface TableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    className?: string;
    zebraStripes?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    // Server-side pagination props
    manualPagination?: boolean;
    pageCount?: number;
    rowCount?: number;
    pagination?: PaginationState;
    onPaginationChange?: (pagination: PaginationState) => void;
}

export function Table<TData>({
    data,
    columns,
    className,
    zebraStripes = true,
    showHeader = true,
    showFooter = false,
    manualPagination,
    pageCount,
    rowCount,
    pagination: controlledPagination,
    onPaginationChange
}: TableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [internalPagination, setInternalPagination] =
        useState<PaginationState>({
            pageIndex: 0,
            pageSize: 15
        });

    // Use controlled pagination if provided, otherwise use internal state
    const paginationState = controlledPagination ?? internalPagination;
    const setPaginationState = onPaginationChange ?? setInternalPagination;

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination: paginationState
        },
        onSortingChange: setSorting,
        onPaginationChange: (updaterOrValue) => {
            const newPagination =
                typeof updaterOrValue === 'function'
                    ? updaterOrValue(paginationState)
                    : updaterOrValue;
            setPaginationState(newPagination);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        ...(manualPagination
            ? {
                  manualPagination: true,
                  pageCount,
                  rowCount
              }
            : {
                  getPaginationRowModel: getPaginationRowModel()
              })
    });

    return (
        <div
            className={cx(
                'overflow-hidden rounded-lg border border-slate-300',
                className
            )}
        >
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    {showHeader && (
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b border-slate-300 bg-white"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="border-r border-slate-300 px-4 py-3 text-left text-sm font-semibold last:border-r-0"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cx(
                                                        'flex items-center gap-2',
                                                        header.column.getCanSort()
                                                            ? 'cursor-pointer select-none'
                                                            : ''
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef
                                                            .header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <span className="text-slate-500">
                                                            {{
                                                                asc: (
                                                                    <ArrowUp className="h-4 w-4" />
                                                                ),
                                                                desc: (
                                                                    <ArrowDown className="h-4 w-4" />
                                                                )
                                                            }[
                                                                header.column.getIsSorted() as string
                                                            ] ?? (
                                                                <ArrowUpDown className="h-4 w-4" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                    )}
                    <tbody>
                        {table.getRowModel().rows.map((row, index) => (
                            <tr
                                key={row.id}
                                className={cx(
                                    'border-b border-slate-300 last:border-b-0',
                                    zebraStripes && index % 2 === 1
                                        ? 'bg-zinc-100'
                                        : 'bg-white'
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="border-r border-slate-300 px-4 py-3 text-sm last:border-r-0"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    {showFooter && (
                        <tfoot>
                            {table.getFooterGroups().map((footerGroup) => (
                                <tr
                                    key={footerGroup.id}
                                    className="border-t border-slate-500 bg-white"
                                >
                                    {footerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="border-r border-slate-500 px-4 py-3 text-left text-sm font-semibold last:border-r-0"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .footer,
                                                      header.getContext()
                                                  )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </tfoot>
                    )}
                </table>
            </div>
            {(manualPagination || data.length > paginationState.pageSize) && (
                <div className="border-t border-slate-300 bg-white px-4 py-3">
                    <Pagination
                        currentPage={paginationState.pageIndex + 1}
                        totalPages={table.getPageCount()}
                        totalItems={rowCount ?? data.length}
                        pageSize={paginationState.pageSize}
                        onPageChange={(page) => table.setPageIndex(page - 1)}
                    />
                </div>
            )}
        </div>
    );
}
