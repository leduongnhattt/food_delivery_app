"use client";

import { mergeClasses, formatDate } from "@/lib/utils";

type TimelineStep = {
  id: string;
  label: string;
  /** ISO string */
  actualAt?: string | null;
  /** ISO string */
  estimateAt?: string | null;
};

function dot(active: boolean) {
  return mergeClasses(
    "h-2.5 w-2.5 rounded-full",
    active ? "bg-[#2563FF]" : "bg-slate-200",
  );
}

export function AdminOrderProcessingTimelineCard({
  steps,
  title = "Order Processing Timeline",
}: {
  title?: string;
  steps: TimelineStep[];
}) {
  const anyActual = steps.some((s) => !!s.actualAt);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="text-[12px] font-semibold text-slate-700">{title}</div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden />
            <span>Estimate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2563FF]" aria-hidden />
            <span>Actual</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          <div className="absolute left-0 right-0 top-3 h-px bg-slate-200" />
          <div className="grid grid-cols-6 gap-2">
            {steps.map((s) => {
              const active = !!s.actualAt;
              return (
                <div key={s.id} className="min-w-0">
                  <div className="flex justify-center">
                    <div className={dot(active)} />
                  </div>
                  <div className="mt-2 text-center text-[11px] font-medium text-slate-600">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-6 gap-2">
          {steps.map((s) => {
            const actual = s.actualAt ? formatDate(s.actualAt) : "-";
            const [d1, t1] = String(actual).split(",");
            const actualDate = s.actualAt ? (d1 ?? actual).trim() : "-";
            const actualTime = s.actualAt ? (t1 ?? "").trim() : "-";

            const estimate = s.estimateAt ? formatDate(s.estimateAt) : "-";
            const [ed1, et1] = String(estimate).split(",");
            const estimateDate = s.estimateAt ? (ed1 ?? estimate).trim() : "-";
            const estimateTime = s.estimateAt ? (et1 ?? "").trim() : "-";

            return (
              <div key={s.id} className="min-w-0 text-center">
                <div
                  className={mergeClasses(
                    "text-[10px] leading-4",
                    s.actualAt ? "text-[#2563FF]" : "text-slate-400",
                  )}
                >
                  {anyActual ? actualDate : estimateDate}
                </div>
                <div
                  className={mergeClasses(
                    "text-[10px] leading-4",
                    s.actualAt ? "text-[#2563FF]" : "text-slate-400",
                  )}
                >
                  {anyActual ? actualTime : estimateTime}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

