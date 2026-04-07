import { type VariantProps } from 'cva';
import { cva } from '../utils/cva.config';
import { Button } from './Button';

const paginationVariants = cva({
    base: 'flex items-center justify-between gap-4',
    variants: {
        align: {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end'
        }
    },
    defaultVariants: {
        align: 'center'
    }
});

export interface PaginationProps extends VariantProps<
    typeof paginationVariants
> {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    className?: string;
    showPageNumbers?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    align,
    className,
    showPageNumbers = false
}: PaginationProps) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
        <div className={paginationVariants({ align, className })}>
            <div className="text-sm text-zinc-600">
                Showing {startItem}-{endItem} of {totalItems}
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={() => onPageChange(1)}
                    disabled={!canGoPrevious}
                    size="sm"
                    aria-label="First page"
                >
                    {'<<'}
                </Button>
                <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrevious}
                    size="sm"
                    aria-label="Previous page"
                >
                    {'<'}
                </Button>
                {showPageNumbers ? (
                    <div className="flex items-center gap-1">
                        {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        onClick={() => onPageChange(pageNum)}
                                        variant={
                                            currentPage === pageNum
                                                ? 'primary'
                                                : 'secondary'
                                        }
                                        size="sm"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            }
                        )}
                    </div>
                ) : (
                    <div className="flex items-center px-3 text-sm text-zinc-700">
                        Page {currentPage} of {totalPages}
                    </div>
                )}
                <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    size="sm"
                    aria-label="Next page"
                >
                    {'>'}
                </Button>
                <Button
                    onClick={() => onPageChange(totalPages)}
                    disabled={!canGoNext}
                    size="sm"
                    aria-label="Last page"
                >
                    {'>>'}
                </Button>
            </div>
        </div>
    );
}
