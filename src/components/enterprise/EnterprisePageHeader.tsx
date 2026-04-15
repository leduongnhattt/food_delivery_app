"use client";

import type { ReactNode } from "react";

/** Title + subtitle aligned with admin list pages (e.g. Enterprise List). */
export function EnterprisePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Panel shell matching admin cards (border-slate-200, rounded-lg). */
export const ENTERPRISE_PANEL_CLASS =
  "rounded-lg border border-slate-200 bg-white shadow-sm";
