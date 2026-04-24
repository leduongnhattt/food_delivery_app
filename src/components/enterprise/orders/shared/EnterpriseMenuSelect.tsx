"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

export type EnterpriseMenuSelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (next: string) => void;
  options: EnterpriseMenuSelectOption[];
  /** Wrapper width / layout */
  className?: string;
  /** Extra classes on the trigger button (e.g. segmented left segment) */
  triggerClassName?: string;
  /** Dropdown panel min-width / width */
  menuClassName?: string;
  alignMenu?: "left" | "right";
  /**
   * Force menu to open on a side.
   * Use with `usePortal` to avoid clipping by overflow containers.
   */
  side?: "bottom" | "top";
  /** Render menu in a portal (fixed-position) to avoid clipping. */
  usePortal?: boolean;
  "aria-label"?: string;
  /** When true, trigger has no ring (use inside a bordered parent) */
  borderlessTrigger?: boolean;
};

/**
 * Custom dropdown matching admin list filters (ring inset, shadow menu, slate hover).
 */
export function EnterpriseMenuSelect({
  value,
  onChange,
  options,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  alignMenu = "left",
  side = "bottom",
  usePortal = false,
  "aria-label": ariaLabel,
  borderlessTrigger = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = !!rootRef.current?.contains(target);
      const clickedMenu = !!menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!open || !usePortal) return;

    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 8; // matches mt-2
      const width = r.width;
      const left = alignMenu === "right" ? r.right - width : r.left;
      const top = side === "top" ? r.top - gap : r.bottom + gap;
      setMenuPos({ left, top, width });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, usePortal, alignMenu, side]);

  const pick = useCallback(
    (v: string) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  const triggerRing = borderlessTrigger
    ? "border-0 ring-0 shadow-none focus:ring-0 focus-visible:ring-0"
    : "ring ring-inset ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-300";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={mergeClasses(
          "relative inline-flex h-9 min-h-9 w-full items-center border-0 bg-white px-3 py-0 text-left text-[13px] text-slate-900 transition-colors disabled:cursor-not-allowed disabled:opacity-75 md:text-[13px]",
          borderlessTrigger ? null : "rounded",
          triggerRing,
          "pe-10",
          triggerClassName,
        )}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        (usePortal ? (
          typeof document !== "undefined" && menuPos
            ? createPortal(
                <div
                  role="listbox"
                  ref={menuRef}
                  className={`fixed z-[100] max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg ${menuClassName}`}
                  style={{
                    left: menuPos.left,
                    top: menuPos.top,
                    minWidth: menuPos.width,
                    // If forced "top", align the menu's bottom to trigger top.
                    transform: side === "top" ? "translateY(-100%)" : undefined,
                  }}
                >
                  {options.map((opt) => {
                    const isSel = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-slate-900 hover:bg-slate-50 md:text-[13px]"
                        onClick={() => pick(opt.value)}
                      >
                        <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                        {isSel ? (
                          <Check className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>,
                document.body,
              )
            : null
        ) : (
          <div
            role="listbox"
            ref={menuRef}
            className={`absolute z-[100] mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg ${
              alignMenu === "right" ? "right-0" : "left-0"
            } min-w-full ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSel = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-slate-900 hover:bg-slate-50 md:text-[13px]"
                  onClick={() => pick(opt.value)}
                >
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {isSel ? (
                    <Check className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}

