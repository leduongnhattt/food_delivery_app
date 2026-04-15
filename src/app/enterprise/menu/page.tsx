"use client";
import { Button } from "@/components/ui/button";
import { Menu, MenuList } from "./MenuList";
import { useEffect, useState } from "react";
import AddNewMenuPopup from "./AddNewMenuPopup";
import EditMenuPopup from "./EditMenuPopup";
import { getServerApiBase } from "@/lib/http-client";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";

export default function AdminDashboardPage() {
  const [entepriseData, setEnterpriseData] = useState<any>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

  async function fetchEnterpriseData() {
    try {
      const base = getServerApiBase();
      const res = await fetch(`${base}/enterprise/profile?include=menus`, {
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch enterprise data");
      const { enterprise } = await res.json();
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
      const base = getServerApiBase();
      await fetch(`${base}/enterprise/menu?menuId=${menuId}`, {
        method: "DELETE",
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      });
      alert("Menu deleted successfully");
      refreshMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
      alert("Failed to delete menu. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <EnterprisePageHeader
        title="Menu Dashboard"
        description="Create and organize menus for your restaurant."
        actions={
          <Button
            onClick={() => setOpenPopup(true)}
            className="h-9 rounded-lg bg-sky-600 px-4 text-[13px] font-medium text-white hover:bg-sky-700"
          >
            Add New Menu
          </Button>
        }
      />
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
