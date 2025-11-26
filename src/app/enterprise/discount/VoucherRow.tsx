import React from "react";
import { Voucher } from "./VoucherList";
import { Edit } from "lucide-react";

export interface VoucherRowProps {
  voucher: Voucher;
  onEdit?: (voucher: Voucher) => void;
}

const VoucherRow: React.FC<VoucherRowProps> = ({
  voucher,
  onEdit,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(voucher);
    }
  };

  return (
    <div className="flex items-center justify-center">
      {onEdit && (
        <button
          onClick={handleEdit}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
          title="Edit voucher"
        >
          <Edit size={12} className="mr-1" />
          Edit
        </button>
      )}
    </div>
  );
};

export { VoucherRow };
