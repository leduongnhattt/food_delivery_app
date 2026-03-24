"use client";
import { apiClient, type ApiResponse } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Menu, MenuList } from "./MenuList";
import { useEffect, useState } from "react";
import AddNewMenuPopup from "./AddNewMenuPopup";
import EditMenuPopup from "./EditMenuPopup";

const isApiError = (response: unknown): response is ApiResponse => {
  return !!response && typeof response === "object" && "success" in response && (response as ApiResponse).success === false;
};

export default function AdminDashboardPage() {
  const [entepriseData, setEnterpriseData] = useState<any>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

  async function fetchEnterpriseData() {
    try {
      const { enterprise } = await apiClient.get<{ enterprise: any }>(
        "/enterprise/profile?include=menus"
      ).then((res) => {
        if (isApiError(res)) {
          throw new Error(res.error || "Failed to fetch enterprise data");
        }
        return res;
      });
      setEnterpriseData(enterprise);
    } catch (error) {
      console.error("Error fetching enterprise data:", error);
    }
  }
  const refreshMenus = async () => {
    await fetchEnterpriseData();
  };
  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  const handleEdit = (menu: Menu) => {
    setSelectedMenu(menu);
  };

  const handleDelete = async (menuId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu?"
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/enterprise/menu?menuId=${menuId}`);
      alert("Menu deleted successfully");
      refreshMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
      alert("Failed to delete menu. Please try again.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-4">Menu Dashboard</h1>
        <Button
          onClick={() => setOpenPopup(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Add New Menu
        </Button>
      </div>
      <MenuList
        menus={entepriseData?.menus ?? []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <AddNewMenuPopup
        open={openPopup}
        onClose={() => setOpenPopup(false)}
        onSuccess={refreshMenus}
      />
      <EditMenuPopup
        open={!!selectedMenu}
        menu={selectedMenu}
        onClose={() => setSelectedMenu(null)}
        onSuccess={refreshMenus}
      />
    </div>
  );
}
