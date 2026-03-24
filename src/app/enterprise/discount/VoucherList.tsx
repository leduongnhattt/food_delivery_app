import React, { useState } from "react";
import { VoucherRow } from "./VoucherRow";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(vouchers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVouchers = vouchers.slice(startIndex, endIndex);

  // Handle page changes
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">Voucher Code</th>
              <th className="py-2 pr-4">Discount Percent</th>
              <th className="py-2 pr-4">Discount Amount</th>
              <th className="py-2 pr-4">Usage Count</th>
              <th className="py-2 pr-4">Expiry Date</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-8">
                  No vouchers available
                </td>
              </tr>
            ) : (
              currentVouchers.map((voucher) => (
                <tr key={voucher.VoucherID} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-900">{voucher.Code}</td>
                  <td className="py-3 pr-4 text-slate-700">
                    {voucher.DiscountPercent ? `${voucher.DiscountPercent}%` : 'N/A'}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {voucher.DiscountAmount ? `$${voucher.DiscountAmount}` : 'N/A'}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {voucher.UsedCount || 0} / {voucher.MaxUsage || '∞'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {voucher.ExpiryDate ? new Date(voucher.ExpiryDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="py-3 pr-4">
                    {voucher.Status === 'Approved' ? (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-center w-24">
                    <VoucherRow
                      voucher={voucher}
                      onEdit={onEdit}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {vouchers.length > 0 && totalPages > 1 && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Results info */}
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, vouchers.length)} of{" "}
              {vouchers.length} vouchers
            </div>

            {/* Pagination controls */}
            <div className="flex items-center space-x-1">
              {/* Previous button */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageClick(pageNumber)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentPage === pageNumber
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              {/* Next button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { VoucherList };
