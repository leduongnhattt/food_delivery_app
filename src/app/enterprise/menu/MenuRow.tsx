import React from "react";
import { Menu } from "./MenuList";
import { Edit, Trash2 } from "lucide-react";

export interface MenuRowProps {
  menu: Menu;
  onEdit?: (menu: Menu) => void;
  onDelete?: (menuId: string) => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ menu, onEdit, onDelete }) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(menu);
    }
  };
  const handleDelete = () => {
    if (onDelete) {
      onDelete(menu.MenuID);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
      {/* Menu Name */}
      <div className="col-span-4 font-medium text-gray-900">
        {menu.MenuName}
      </div>

      {/* Description */}
      <div className="col-span-5 text-gray-500 truncate">
        {menu.Description || "No description"}
      </div>
      {/* Action Buttons */}
      <div className="col-span-3 flex space-x-2">
        <div className="inline-flex items-center border rounded-md overflow-hidden">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 bg-white text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="Edit food item"
            >
              <Edit size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border-l border-gray-300"
              title="Delete food item"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export { MenuRow };
