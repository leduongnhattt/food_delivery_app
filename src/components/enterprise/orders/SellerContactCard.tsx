"use client";

export function SellerContactCard() {
  return (
    <div className="flex flex-col gap-0 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563FF] text-sm font-semibold text-white">
          SE
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">Seller</h3>
        </div>
      </div>
    </div>
  );
}

