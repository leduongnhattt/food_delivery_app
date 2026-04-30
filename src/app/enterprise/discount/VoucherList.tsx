import React, { useMemo, useState } from "react";
import { VoucherRow } from "./VoucherRow";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface Voucher {
  VoucherID: string;
  Code: string;
  DiscountPercent?: number;
  DiscountAmount?: number;
  MinOrderValue?: number;
  MaxUsage?: number;
  UsedCount: number;
  ExpiryDate: string;
  Status: string;
}

export interface VoucherListProps {
  vouchers: Voucher[];
  onEdit?: (voucher: Voucher) => void;
}

const VoucherList: React.FC<VoucherListProps> = ({
  vouchers,
  onEdit,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const total = vouchers.length;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );
  const safePage = useMemo(
    () => Math.min(Math.max(1, page), totalPages),
    [page, totalPages],
  );
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentVouchers = useMemo(
    () => vouchers.slice(startIndex, endIndex),
    [vouchers, startIndex, endIndex],
  );

  const showingFrom = total === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(total, endIndex);
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-[13px]">
        <thead className="border-b border-slate-200">
          <tr className="text-left text-slate-500">
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
              Voucher Code
            </th>
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
              Discount Percent
            </th>
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
              Discount Amount
            </th>
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
              Usage Count
            </th>
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
              Expiry Date
            </th>
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
              Status
            </th>
            <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)] text-center w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vouchers.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-slate-500 text-[13px] leading-4 font-normal py-8">
                No vouchers found
              </td>
            </tr>
          ) : (
            currentVouchers.map((voucher) => (
              <tr key={voucher.VoucherID} className="hover:bg-slate-50">
                <td className="py-3 pr-4 text-[13px] leading-4 font-medium text-slate-900">
                  {voucher.Code}
                </td>
                <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                  {voucher.DiscountPercent ? `${voucher.DiscountPercent}%` : "N/A"}
                </td>
                <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                  {voucher.DiscountAmount ? `$${voucher.DiscountAmount}` : "N/A"}
                </td>
                <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {voucher.UsedCount || 0} / {voucher.MaxUsage || "∞"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                  {voucher.ExpiryDate ? new Date(voucher.ExpiryDate).toLocaleDateString("vi-VN") : "N/A"}
                </td>
                <td className="py-3 pr-4">
                  {String(voucher.Status || "").toLowerCase() === "approved" ? (
                    <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Approved
                    </span>
                  ) : String(voucher.Status || "").toLowerCase() === "rejected" ? (
                    <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Rejected
                    </span>
                  ) : String(voucher.Status || "").toLowerCase() === "expired" ? (
                    <span className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200">
                      Expired
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-center w-24">
                  <VoucherRow voucher={voucher} onEdit={onEdit} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {total > 0 ? (
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={total}
          onPageChange={(n) => setPage(n)}
          onPageSizeChange={(n) => {
            setPageSize(n as any);
            setPage(1);
          }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          leftSlot={
            <div className="text-[11px] font-normal leading-4 text-slate-600">
              Showing <span className="text-slate-900">{showingFrom}</span> -{" "}
              <span className="text-slate-900">{showingTo}</span> of{" "}
              <span className="text-slate-900">{total}</span> vouchers
            </div>
          }
        />
      ) : null}
    </div>
  );
};

export { VoucherList };
