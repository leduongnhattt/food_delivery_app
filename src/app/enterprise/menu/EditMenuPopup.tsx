import { useEffect, useState } from "react";
import { apiClient } from "@/services/api";
import { Menu } from "./MenuList";

interface EditMenuPopupProps {
  open: boolean;
  menu: Menu | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMenuPopup({
  open,
  menu,
  onClose,
  onSuccess,
}: EditMenuPopupProps) {
  const [menuName, setMenuName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (menu) {
      setMenuName(menu.MenuName || "");
      setDescription(menu.Description || "");
    }
  }, [menu]);

  if (!open) return null;

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to edit this menu?"
    );
    if (!confirmed) return;

    if (!menuName.trim()) {
      setError("Menu name is required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.put("/enterprise/menu", {
        MenuID: menu?.MenuID, // chú ý: phải khớp với API, không phải MenuId
        MenuName: menuName,
        Description: description,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating menu:", err);
      setError("Failed to update menu. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Menu</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Menu Name *</label>
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              disabled={loading}
              className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
