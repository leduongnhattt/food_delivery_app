"use client"

import React, { useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { mergeClasses } from "@/lib/utils"

export type AdminFilterOption = { value: string; label: string }

export function adminFilterOptionsFromStrings(strings: readonly string[]): AdminFilterOption[] {
  return strings.map((s) => ({ value: s, label: s }))
}

export function AdminFilterMenu({
  menuId,
  ariaLabel,
  value,
  options,
  onChange,
  openMenuId,
  setOpenMenuId,
}: {
  menuId: string
  ariaLabel: string
  value: string
  options: readonly AdminFilterOption[]
  onChange: (next: string) => void
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
}) {
  const open = openMenuId === menuId
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null
      if (rootRef.current && t && !rootRef.current.contains(t)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [open, setOpenMenuId])

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseDown={(ev) => ev.stopPropagation()}
        onClick={(ev) => {
          ev.stopPropagation()
          setOpenMenuId(open ? null : menuId)
        }}
        className="relative group inline-flex h-8 min-h-8 w-full min-w-0 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 px-3 py-0 text-left text-xs leading-normal text-slate-900 bg-white ring ring-inset ring-slate-200 hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10"
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronDown
          className={mergeClasses(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform duration-150",
            open ? "rotate-180" : "",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          onClick={(ev) => ev.stopPropagation()}
          className="absolute right-0 z-50 mt-2 w-full min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-900 hover:bg-slate-50"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onChange(opt.value)
                setOpenMenuId(null)
              }}
            >
              <span className="min-w-0 truncate">{opt.label}</span>
              {value === opt.value ? (
                <Check className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

