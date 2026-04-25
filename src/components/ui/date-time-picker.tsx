"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  X,
} from "lucide-react"
import { mergeClasses } from "@/lib/utils"

type Mode = "date" | "datetime"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isISODatetimeLocal(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseISODate(value: string): Date | null {
  if (!isISODate(value)) return null
  const [y, m, d] = value.split("-").map((x) => Number(x))
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function parseISODatetimeLocal(value: string): Date | null {
  if (!isISODatetimeLocal(value)) return null
  const [datePart, timePart] = value.split("T")
  if (!datePart || !timePart) return null
  const base = parseISODate(datePart)
  if (!base) return null
  const [hh, mm] = timePart.split(":").map((x) => Number(x))
  const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh || 0, mm || 0, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function formatDisplay(d: Date, mode: Mode) {
  // Display as dd/mm/yyyy (and HH:mm) to match common admin UX
  const dd = pad2(d.getDate())
  const mm = pad2(d.getMonth() + 1)
  const yyyy = d.getFullYear()
  if (mode === "date") return `${dd}/${mm}/${yyyy}`
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

function clampByMinMax(d: Date, min?: string, max?: string) {
  const t = d.getTime()
  if (min) {
    const minDt = parseISODate(min)
    if (minDt && t < minDt.getTime()) return minDt
  }
  if (max) {
    const maxDt = parseISODate(max)
    if (maxDt && t > maxDt.getTime()) return maxDt
  }
  return d
}

function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate()
}

function startDow(year: number, month0: number) {
  return new Date(year, month0, 1).getDay() // 0=Sun
}

function monthLabel(year: number, month0: number) {
  return new Date(year, month0, 1).toLocaleString("en-US", { month: "long", year: "numeric" })
}

function addMonths(view: { year: number; month0: number }, delta: number) {
  const base = new Date(view.year, view.month0, 1)
  base.setMonth(base.getMonth() + delta)
  return { year: base.getFullYear(), month0: base.getMonth() }
}

function addYears(view: { year: number; month0: number }, delta: number) {
  return { year: view.year + delta, month0: view.month0 }
}

export function DateTimePickerField({
  value,
  onChange,
  mode = "date",
  label,
  placeholder,
  disabled,
  min,
  max,
  triggerClassName,
  popoverClassName,
  align = "end",
}: {
  value?: string
  onChange: (next: string) => void
  mode?: Mode
  label?: string
  placeholder?: string
  disabled?: boolean
  min?: string
  max?: string
  triggerClassName?: string
  popoverClassName?: string
  align?: "start" | "end"
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => {
    if (!value) return null
    return mode === "date" ? parseISODate(value) : parseISODatetimeLocal(value)
  }, [value, mode])

  const [view, setView] = useState(() => {
    const base = selectedDate ?? new Date()
    return { year: base.getFullYear(), month0: base.getMonth() }
  })

  useEffect(() => {
    if (!open) return
    const base = selectedDate ?? new Date()
    setView({ year: base.getFullYear(), month0: base.getMonth() })
  }, [open, selectedDate])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null
      if (rootRef.current && t && !rootRef.current.contains(t)) setOpen(false)
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const weeks = useMemo((): Date[][] => {
    const { year, month0 } = view
    const total = daysInMonth(year, month0)
    const offset = startDow(year, month0)
    const prev = addMonths({ year, month0 }, -1)
    const prevTotal = daysInMonth(prev.year, prev.month0)

    const cells = Array.from({ length: 42 }).map((_, idx) => {
      const day = idx - offset + 1
      if (day < 1) return new Date(prev.year, prev.month0, prevTotal + day)
      if (day > total) return new Date(year, month0 + 1, day - total)
      return new Date(year, month0, day)
    })
    const out: Date[][] = []
    for (let i = 0; i < 6; i++) out.push(cells.slice(i * 7, i * 7 + 7))
    return out
  }, [view])

  const displayText = selectedDate ? formatDisplay(selectedDate, mode) : ""

  const timeValue = useMemo(() => {
    if (mode !== "datetime") return "00:00"
    if (!selectedDate) return "00:00"
    return `${pad2(selectedDate.getHours())}:${pad2(selectedDate.getMinutes())}`
  }, [mode, selectedDate])

  const setDatePart = (d: Date) => {
    const clamped = clampByMinMax(d, min, max)
    if (mode === "date") {
      onChange(toDateKey(clamped))
      setOpen(false)
      return
    }
    const cur = selectedDate ?? new Date()
    const next = new Date(clamped.getFullYear(), clamped.getMonth(), clamped.getDate(), cur.getHours(), cur.getMinutes(), 0, 0)
    onChange(`${toDateKey(next)}T${pad2(next.getHours())}:${pad2(next.getMinutes())}`)
    setOpen(false)
  }

  const setTimePart = (t: string) => {
    if (mode !== "datetime") return
    const base = selectedDate ?? new Date()
    const [hh, mm] = t.split(":").map((x) => Number(x))
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh || 0, mm || 0, 0, 0)
    onChange(`${toDateKey(next)}T${pad2(next.getHours())}:${pad2(next.getMinutes())}`)
  }

  const today = new Date()
  const selectedKey = selectedDate ? toDateKey(selectedDate) : ""
  const todayKey = toDateKey(today)

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      {label ? (
        <div className="mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onMouseDown={(ev) => ev.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={mergeClasses(
          "relative w-full min-w-0 text-left",
          "disabled:cursor-not-allowed disabled:opacity-75",
          triggerClassName ??
            "w-full h-8 min-h-8 border-0 bg-white py-0 ps-3 pe-9 text-[13px] leading-normal text-slate-900 ring ring-inset ring-slate-200 rounded transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
        )}
      >
        <span
          className={mergeClasses(
            "block truncate",
            displayText ? "text-slate-900 font-medium" : "text-slate-400",
          )}
        >
          {displayText || placeholder || (mode === "date" ? "dd/mm/yyyy" : "dd/mm/yyyy HH:mm")}
        </span>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
          {mode === "datetime" ? <Clock className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Date picker"
          className={mergeClasses(
            "absolute z-50 mt-1 w-[272px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
            // keep a small gutter from viewport edges
            align === "end" ? "right-2" : "left-2",
            popoverClassName,
          )}
        >
          <div className="flex items-center justify-between gap-1 px-2 py-1 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setView((v) => addYears(v, -1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-50"
              aria-label="Previous year"
            >
              <ChevronsLeft className="h-3.5 w-3.5 text-slate-700" />
            </button>

            <button
              type="button"
              onClick={() => setView((v) => addMonths(v, -1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-slate-700" />
            </button>

            <div className="flex-1 text-center text-[12px] font-semibold text-slate-900">
              {monthLabel(view.year, view.month0)}
            </div>

            <button
              type="button"
              onClick={() => setView((v) => addMonths(v, 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
            </button>

            <button
              type="button"
              onClick={() => setView((v) => addYears(v, 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-50"
              aria-label="Next year"
            >
              <ChevronsRight className="h-3.5 w-3.5 text-slate-700" />
            </button>
          </div>

          <div className="px-2 py-1.5">
            <div className="grid grid-cols-7 text-[10px] font-semibold text-slate-500 mb-0.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                <div key={`${d}-${idx}`} className="h-5 flex items-center justify-center">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {weeks.flat().map((d) => {
                const key = toDateKey(d)
                const isSelected = key === selectedKey
                const isToday = key === todayKey
                const isOutsideMonth = d.getFullYear() !== view.year || d.getMonth() !== view.month0
                const minDt = min ? parseISODate(min) : null
                const maxDt = max ? parseISODate(max) : null
                const outOfRange =
                  (minDt ? d.getTime() < minDt.getTime() : false) ||
                  (maxDt ? d.getTime() > maxDt.getTime() : false)

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={outOfRange}
                    onClick={() => setDatePart(d)}
                    className={mergeClasses(
                      "relative h-6 rounded-md text-[11px] transition-colors outline-none",
                      outOfRange
                        ? "text-slate-300 cursor-not-allowed"
                        : "hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white",
                      isOutsideMonth ? "text-slate-400" : "text-slate-700",
                      isSelected
                        ? "bg-slate-100 text-[#2563FF] font-semibold ring-1 ring-inset ring-slate-200"
                        : "",
                      !outOfRange && !isSelected && isToday
                        ? "text-[#2563FF] font-semibold text-[12px]"
                        : "",
                    )}
                  >
                    <span className="inline-flex items-center justify-center w-full">
                      {d.getDate()}
                    </span>
                    {outOfRange ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-slate-300"
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>

            {mode === "datetime" ? (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <div className="text-xs text-slate-600">Time</div>
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimePart(e.target.value)}
                  className="h-6 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            ) : null}
          </div>

        </div>
      ) : null}
    </div>
  )
}

