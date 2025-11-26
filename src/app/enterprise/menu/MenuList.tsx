import React from "react";
import { MenuRow } from "./MenuRow";

export interface Menu {
  MenuID: string;
  MenuName: string;
  Description: string;
}
export interface MenuListProps {
  menus: Menu[];
  onEdit?: (menu: Menu) => void;
  onDelete?: (menuId: string) => void;
}
const MenuList: React.FC<MenuListProps> = ({ menus, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
        <div className="col-span-4">Menu Name</div>
        <div className="col-span-5">Description</div>
        <div className="col-span-3">Action</div>
      </div>
      {/* Menu Rows */}
      {menus.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No menus available.</div>
      ) : (
        menus.map((menu) => (
          <MenuRow
            key={menu.MenuID}
            menu={menu}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
export { MenuList };