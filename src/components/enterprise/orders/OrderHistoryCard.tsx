"use client";

import { Clock } from "lucide-react";

export function OrderHistoryCard(props: {
  items: Array<{ title: string; description?: string; formattedDate: string }>;
}) {
  return (
    <div className="flex flex-col gap-0 rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-start gap-2">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
        <h3 className="font-medium">Order History</h3>
      </div>
      <div className="pl-1.5">
        {props.items.map((a, i) => (
          <div key={`${a.title}-${a.formattedDate}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center pt-2">
              <div
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  i === 0 ? "bg-[#2563FF]" : "bg-gray-400"
                }`}
              />
              {i < props.items.length - 1 ? (
                <div className="min-h-[40px] w-px flex-1 bg-gray-200" />
              ) : null}
            </div>
            <div className="flex-1 pb-[21px] pl-[2px]">
              <p className={`text-sm font-medium ${i === 0 ? "text-[#2563FF]" : ""}`}>{a.title}</p>
              {a.description ? <p className="text-sm text-gray-600">{a.description}</p> : null}
              <p className="mt-1 text-xs text-gray-400">{a.formattedDate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

