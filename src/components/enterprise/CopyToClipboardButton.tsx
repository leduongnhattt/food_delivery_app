"use client";

import { useToast } from "@/contexts/toast-context";

export function CopyToClipboardButton(props: {
  text: string;
  label: string;
  className?: string;
  iconClassName?: string;
}) {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.text);
          showToast("Copied", "success");
        } catch {
          showToast("Could not copy", "error");
        }
      }}
      className={
        props.className ??
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95"
      }
      aria-label={`Copy ${props.label}`}
      title={`Copy ${props.label}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className={props.iconClassName ?? "h-[18px] w-[18px]"}
      >
        <path
          d="M9 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M5 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

