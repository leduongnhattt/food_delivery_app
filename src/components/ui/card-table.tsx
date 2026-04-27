"use client";

import React, { useMemo } from "react";
import { mergeClasses } from "@/lib/utils";
import { Pagination, type PaginationProps } from "@/components/ui/pagination";

type OffsetPaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  pageSizeOptions?: readonly number[];
  showRowsPerPage?: boolean;
  leftSlot?: React.ReactNode;
};

export type CardTableProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  pagination?: OffsetPaginationConfig | null;
};

export function CardTable({
  header,
  children,
  className,
  bodyClassName,
  footerClassName,
  isEmpty,
  emptyState,
  pagination,
}: CardTableProps) {
  const pagerProps = useMemo<PaginationProps | null>(() => {
    if (!pagination) return null;
    return {
      variant: "offset",
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      onPageChange: pagination.onPageChange,
      onPageSizeChange: pagination.onPageSizeChange,
      pageSizeOptions: pagination.pageSizeOptions,
      showRowsPerPage: pagination.showRowsPerPage,
      leftSlot: pagination.leftSlot,
    };
  }, [pagination]);

  return (
    <div className={mergeClasses("rounded border border-gray-200 bg-white", className)}>
      {header ? (
        <div className="sticky top-[13px] z-20 rounded-t border-b border-gray-200 bg-gray-50">
          {header}
        </div>
      ) : null}

      <div className={mergeClasses("bg-white", bodyClassName)}>
        {isEmpty ? (
          emptyState ?? (
            <div className="py-12 text-center text-sm text-gray-500">
              No results.
            </div>
          )
        ) : (
          children
        )}
      </div>

      {pagerProps ? (
        <Pagination
          {...pagerProps}
          className={mergeClasses("bg-white", footerClassName)}
        />
      ) : null}
    </div>
  );
}

