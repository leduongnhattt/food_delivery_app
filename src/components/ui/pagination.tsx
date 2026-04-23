"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

type SizeOption = number;

type BaseProps = {
  className?: string;
  pageSizeOptions?: readonly SizeOption[];
  showRowsPerPage?: boolean;
};

type OffsetPaginationProps = BaseProps & {
  variant?: "offset";
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  leftSlot?: React.ReactNode;
};

type CursorPaginationProps = BaseProps & {
  variant: "cursor";
  canPrev: boolean;
  canNext: boolean;
  pageLabel: string;
  onPrev: () => void;
  onNext: () => void;
  pageSize: number;
  onPageSizeChange: (nextSize: number) => void;
  leftSlot?: React.ReactNode;
};

export type PaginationProps = OffsetPaginationProps | CursorPaginationProps;

const DEFAULT_PAGE_SIZE_OPTIONS = [12, 24, 48] as const satisfies readonly SizeOption[];

function RowsPerPageMenu({
  pageSize,
  options,
  onChange,
}: {
  pageSize: number;
  options: readonly SizeOption[];
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      const clicked = !!(rootRef.current && t && rootRef.current.contains(t));
      if (!clicked) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onMouseDown={(ev) => ev.stopPropagation()}
        onClick={(ev) => {
          ev.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative inline-flex h-8 min-w-[100px] items-center justify-between rounded border border-slate-200 bg-white px-2.5 text-[11px] leading-4 text-slate-700 hover:bg-slate-50"
        aria-label="Rows per page"
        aria-expanded={open}
      >
        <span>{pageSize} / page</span>
        <ChevronDown
          className={mergeClasses(
            "ml-2 h-4 w-4 text-slate-500 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute right-0 bottom-full mb-1 w-full min-w-[104px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-50 p-1">
          {options.map((n) => {
            const active = n === pageSize;
            return (
              <button
                key={n}
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
                className={mergeClasses(
                  "w-full px-2 py-1.5 text-left text-[11px] leading-4 rounded-md transition",
                  active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <span className="flex items-center justify-between">
                  <span>{n} / page</span>
                  {active ? <Check className="h-3.5 w-3.5 text-slate-700" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Pagination(props: PaginationProps) {
  const pageSizeOptions = props.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const showRowsPerPage = props.showRowsPerPage ?? true;

  const leftSlot = useMemo(() => {
    if (props.leftSlot) return props.leftSlot;
    if (props.variant === "cursor") return null;

    const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize));
    const safePage = Math.min(Math.max(1, props.page), totalPages);
    const start = props.total === 0 ? 0 : (safePage - 1) * props.pageSize + 1;
    const end = Math.min(props.total, safePage * props.pageSize);

    return (
      <div className="text-[11px] font-normal leading-4 text-slate-600">
        Showing <span className="text-slate-900">{start}</span> -{" "}
        <span className="text-slate-900">{end}</span> of{" "}
        <span className="text-slate-900">{props.total}</span> results
      </div>
    );
  }, [props]);

  const rightControls = useMemo(() => {
    if (props.variant === "cursor") {
      return {
        prevDisabled: !props.canPrev,
        nextDisabled: !props.canNext,
        onPrev: props.onPrev,
        onNext: props.onNext,
        pageLabel: props.pageLabel,
      };
    }

    const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize));
    const safePage = Math.min(Math.max(1, props.page), totalPages);
    return {
      prevDisabled: safePage <= 1,
      nextDisabled: safePage >= totalPages,
      onPrev: () => props.onPageChange(Math.max(1, safePage - 1)),
      onNext: () => props.onPageChange(Math.min(totalPages, safePage + 1)),
      pageLabel: `${safePage} / ${totalPages}`,
    };
  }, [props]);

  return (
    <div
      className={mergeClasses("border-t border-slate-100 px-4 py-3", props.className)}
    >
      <div className="flex items-center justify-end gap-3">
        {leftSlot ? <div className="mr-auto">{leftSlot}</div> : null}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={rightControls.onPrev}
            disabled={rightControls.prevDisabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-[11px] leading-4 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          <div className="min-w-[56px] text-center text-[11px] font-normal tabular-nums text-slate-700">
            {rightControls.pageLabel}
          </div>

          <button
            type="button"
            onClick={rightControls.onNext}
            disabled={rightControls.nextDisabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-[11px] leading-4 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        {showRowsPerPage ? (
          <RowsPerPageMenu
            pageSize={props.pageSize}
            options={pageSizeOptions}
            onChange={(n) => props.onPageSizeChange(n)}
          />
        ) : null}
      </div>
    </div>
  );
}

