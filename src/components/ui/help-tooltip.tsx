"use client";

import { useId } from "react";
import { CircleHelp } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

export function HelpTooltip({
  text,
  className,
  iconClassName,
}: {
  text: string;
  className?: string;
  iconClassName?: string;
}) {
  const id = useId();

  return (
    <span className={mergeClasses("group relative inline-flex items-center", className)}>
      <button
        type="button"
        className={mergeClasses(
          "inline-flex items-center justify-center rounded-sm text-slate-400",
          "hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563FF]/40",
        )}
        aria-describedby={id}
        aria-label="Help"
      >
        <CircleHelp
          className={mergeClasses("h-3.5 w-3.5", iconClassName)}
          strokeWidth={1.75}
        />
        <span className="sr-only">{text}</span>
      </button>

      <span
        id={id}
        role="tooltip"
        className={mergeClasses(
          "pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-max max-w-[260px]",
          "rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] leading-4 text-slate-700 shadow-lg",
          "group-hover:block group-focus-visible:block",
        )}
      >
        {text}
      </span>
    </span>
  );
}

