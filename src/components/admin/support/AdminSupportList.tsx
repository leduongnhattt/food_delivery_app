"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react"
import { fetchAdminSupportTickets } from "@/services/admin-support.service"
import type { AdminSupportTicketListItem } from "@/types/support-api.types"
import { mergeClasses, formatDate } from "@/lib/utils"
import { EnterpriseMenuSelect } from "@/components/enterprise/orders/shared/EnterpriseMenuSelect"
import {
  SUPPORT_CATEGORY_FILTER_OPTIONS,
  SupportCategoryLabel,
  SupportStatusBadge,
} from "@/components/support/support-ui"
import { useToast } from "@/contexts/toast-context"
import {
  ADMIN_FIELD_BASE_CLASS,
  ADMIN_MENU_TRIGGER_CLASS,
  FILTER_MENU_TRIGGER_WRAP,
  FILTER_PERIOD_WRAP,
  FILTER_SEARCH_WRAP,
} from "@/components/admin/shared/admin-field-classes"
import { DateTimePickerField } from "@/components/ui/date-time-picker"

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
]

function filterMenuTriggerClass(open: boolean) {
  return mergeClasses(ADMIN_MENU_TRIGGER_CLASS, open && "ring-2 ring-inset ring-blue-500")
}

export default function AdminSupportList() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<AdminSupportTicketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [qMode, setQMode] = useState<"sender" | "email">("sender")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false)
  const [openPeriod, setOpenPeriod] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const categoryMenuRef = useRef<HTMLDivElement | null>(null)
  const periodRef = useRef<HTMLDivElement | null>(null)
  const [pageSize, setPageSize] = useState<12 | 24 | 48>(12)
  const [page, setPage] = useState(1)
  const [openLimitMenu, setOpenLimitMenu] = useState(false)
  const limitMenuRef = useRef<HTMLDivElement | null>(null)

  const queryKey = useMemo(
    () => `${qMode}::${q}::${status}::${category}::${from}::${to}`,
    [qMode, q, status, category, from, to],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAdminSupportTickets({
        status: status || undefined,
        category: category || undefined,
        from: from || undefined,
        to: to || undefined,
      })
      setTickets(res.tickets ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tickets"
      showToast(msg, "error", 4000)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [showToast, status, category, from, to])

  const filteredTickets = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return tickets
    return tickets.filter((t) => {
      if (qMode === "email") return (t.requesterEmail || "").toLowerCase().includes(qq)
      return (t.requesterUsername || "").toLowerCase().includes(qq)
    })
  }, [tickets, q, qMode])

  useEffect(() => {
    void load()
  }, [load, queryKey])

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null
      const clickedStatus = !!(statusMenuRef.current && t && statusMenuRef.current.contains(t))
      const clickedCategory = !!(categoryMenuRef.current && t && categoryMenuRef.current.contains(t))
      const clickedPeriod = !!(periodRef.current && t && periodRef.current.contains(t))
      const clickedLimit = !!(limitMenuRef.current && t && limitMenuRef.current.contains(t))
      if (!clickedStatus) setOpenStatusMenu(false)
      if (!clickedCategory) setOpenCategoryMenu(false)
      if (!clickedPeriod) setOpenPeriod(false)
      if (!clickedLimit) setOpenLimitMenu(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [])

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIdx = (safePage - 1) * pageSize
  const pageTickets = filteredTickets.slice(startIdx, startIdx + pageSize)

  const statusLabel = STATUS_FILTER.find((x) => x.value === status)?.label ?? "All statuses"
  const categoryLabel =
    SUPPORT_CATEGORY_FILTER_OPTIONS.find((x) => x.value === category)?.label ?? "All categories"
  const periodLabel =
    from && to ? `${from} to ${to}` : from ? `${from} onwards` : to ? `Until ${to}` : "Period"

  const qModeOptions = useMemo(
    () => [
      { value: "sender", label: "Sender" },
      { value: "email", label: "Email" },
    ],
    [],
  )

  const searchPlaceholder = useMemo(() => {
    if (qMode === "email") return "Search by sender email"
    return "Search by sender name"
  }, [qMode])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
              Support inbox
            </h1>
            <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              Review and respond to customer and business requests. Replies notify users by email.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-8 min-h-8 items-center gap-2 rounded border border-[#93C5FD] bg-white px-4 text-[12px] font-medium text-[#2563FF] hover:bg-[#EFF6FF] disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className={FILTER_SEARCH_WRAP}>
              {/* Segmented search: mode select + input share one border */}
              <div className="flex min-w-0 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
                <EnterpriseMenuSelect
                  value={qMode}
                  onChange={(next) => {
                    setQMode(next as any)
                    setPage(1)
                  }}
                  options={qModeOptions as any}
                  className="w-36 shrink-0"
                  borderlessTrigger
                  triggerClassName="h-8 min-h-8 rounded-none rounded-l-md rounded-r-none"
                  aria-label="Search by field"
                  alignMenu="left"
                  menuClassName="min-w-[160px]"
                />
                <div className="relative min-w-0 flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-8 min-h-8 min-w-0 w-full rounded-none rounded-r-md border-0 border-l border-slate-200 bg-white px-3 ps-10 text-[13px] leading-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-75"
                    placeholder={searchPlaceholder}
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search support tickets"
                  />
                </div>
              </div>
            </div>

            <div ref={periodRef} className={FILTER_PERIOD_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setOpenPeriod((v) => !v)
                  setOpenStatusMenu(false)
                  setOpenCategoryMenu(false)
                }}
                className={filterMenuTriggerClass(openPeriod)}
                aria-label="Period"
                aria-haspopup="dialog"
                aria-expanded={openPeriod}
              >
                <span className="truncate">{periodLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openPeriod ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openPeriod ? (
                <div
                  role="dialog"
                  aria-label="Period filter"
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,360px)] min-w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg overflow-visible"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-medium text-slate-600">
                        From
                      </div>
                      <DateTimePickerField
                        value={from}
                        onChange={(next) => {
                          setFrom(next)
                          setPage(1)
                        }}
                        mode="date"
                        placeholder="From"
                        align="start"
                        triggerClassName={ADMIN_FIELD_BASE_CLASS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-medium text-slate-600">To</div>
                      <DateTimePickerField
                        value={to}
                        onChange={(next) => {
                          setTo(next)
                          setPage(1)
                        }}
                        mode="date"
                        placeholder="To"
                        align="start"
                        triggerClassName={ADMIN_FIELD_BASE_CLASS}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-start">
                    <button
                      type="button"
                      className="text-[12px] font-medium text-slate-600 hover:text-slate-900"
                      onClick={() => {
                        setFrom("")
                        setTo("")
                        setPage(1)
                        setOpenPeriod(false)
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={categoryMenuRef} className={FILTER_MENU_TRIGGER_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setOpenCategoryMenu((v) => !v)
                  setOpenStatusMenu(false)
                  setOpenPeriod(false)
                }}
                className={filterMenuTriggerClass(openCategoryMenu)}
                aria-label="Category"
                aria-haspopup="menu"
                aria-expanded={openCategoryMenu}
              >
                <span className="truncate">{categoryLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openCategoryMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openCategoryMenu && (
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute left-0 mt-2 w-full min-w-[220px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50 max-h-[320px] overflow-y-auto"
                >
                  {SUPPORT_CATEGORY_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value || "all-cat"}
                      type="button"
                      onClick={() => {
                        setOpenCategoryMenu(false)
                        setCategory(opt.value)
                        setPage(1)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span className="truncate">{opt.label}</span>
                      {category === opt.value && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={statusMenuRef} className={FILTER_MENU_TRIGGER_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setOpenStatusMenu((v) => !v)
                  setOpenCategoryMenu(false)
                  setOpenPeriod(false)
                }}
                className={filterMenuTriggerClass(openStatusMenu)}
                aria-label="Status"
                aria-haspopup="menu"
                aria-expanded={openStatusMenu}
              >
                <span className="truncate">{statusLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openStatusMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openStatusMenu && (
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute left-0 mt-2 w-full min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
                >
                  {STATUS_FILTER.map((opt) => (
                    <button
                      key={opt.value || "all-status"}
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setStatus(opt.value)
                        setPage(1)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>{opt.label}</span>
                      {status === opt.value && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No tickets match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px] leading-4">
              <thead>
                <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
                  <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Subject
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Sender
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Email
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Category
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Status
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Sent
                  </th>
                  <th className="py-2 pr-4 text-right w-24 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2 pr-4 pl-4">
                      <div className="font-medium text-slate-900 line-clamp-2">
                        {t.subject}
                      </div>
                      {t.hasReply && (
                        <span className="text-[11px] text-emerald-600 font-medium">
                          Replied
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-700 font-medium">
                      <div className="font-medium text-slate-800">
                        {t.requesterUsername}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      <div className="text-[12px] leading-4 text-slate-600 truncate max-w-[220px]">
                        {t.requesterEmail}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <SupportCategoryLabel category={t.category} />
                    </td>
                    <td className="py-2 pr-4">
                      <SupportStatusBadge status={t.status} />
                    </td>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                      {formatDate(t.sentAt)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Link
                        href={`/admin/support/${encodeURIComponent(t.id)}`}
                        className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tickets.length > 0 ? (
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-[12px] leading-4 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>

                <div className="min-w-[64px] text-center text-[12px] font-normal tabular-nums text-slate-700">
                  {safePage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-[12px] leading-4 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>

              <div ref={limitMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setOpenLimitMenu((v) => !v)
                  }}
                  className="relative inline-flex h-9 min-w-[104px] items-center justify-between rounded border border-slate-200 bg-white px-3 text-[12px] leading-4 text-slate-700 hover:bg-slate-50"
                  aria-label="Rows per page"
                  aria-expanded={openLimitMenu}
                >
                  <span>{pageSize} / page</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-2 text-slate-500 transition-transform duration-150 ${
                      openLimitMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openLimitMenu ? (
                  <div className="absolute right-0 bottom-full mb-1 w-full min-w-[104px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-50 p-1">
                    {([12, 24, 48] as const).map((n) => {
                      const active = n === pageSize
                      return (
                        <button
                          key={n}
                          type="button"
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => {
                            setOpenLimitMenu(false)
                            setPageSize(n)
                            setPage(1)
                          }}
                          className={`w-full px-2 py-1.5 text-left text-[12px] leading-4 rounded-md transition ${
                            active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{n} / page</span>
                            {active ? <Check className="w-3.5 h-3.5 text-slate-700" /> : null}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
