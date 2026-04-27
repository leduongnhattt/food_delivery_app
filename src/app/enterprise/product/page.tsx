'use client'
import { getServerApiBase } from "@/lib/http"
import { buildAuthHeader } from "@/lib/auth-helpers"
import { useEffect, useMemo, useState } from "react"
import FoodList, { Food } from "./FoodList";
import { useEnterpriseUpload } from "@/hooks/use-enterprise-upload";
import EditFoodPopup from "./EditFoodPopup";
import { useToast } from "@/contexts/toast-context";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";
import { CategoryService, type CategoryDto } from "@/services/category.service";

export default function AdminDashboardPage() {
  const [entepriseData, setEnterpriseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "price_asc" | "price_desc">("name_asc");
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  
  const { deleteImage, deleteError } = useEnterpriseUpload();
  const { showToast } = useToast();

  const foods: Food[] = useMemo(() => {
    return Array.isArray(entepriseData?.foods) ? (entepriseData.foods as Food[]) : [];
  }, [entepriseData]);

  const categoryOptions: DropdownSelectOption[] = useMemo(() => {
    const derived = (categories ?? [])
      .filter((c) => typeof c?.id === "string" && c.id && typeof c?.name === "string" && c.name)
      .map((c) => ({ value: c.id, label: c.name }));
    return [{ value: "all", label: "All categories" }, ...derived];
  }, [categories]);

  const sortOptions: DropdownSelectOption[] = useMemo(() => {
    return [
      { value: "name_asc", label: "Name (A → Z)" },
      { value: "name_desc", label: "Name (Z → A)" },
      { value: "price_asc", label: "Price (Low → High)" },
      { value: "price_desc", label: "Price (High → Low)" },
    ];
  }, []);

  const statusOptions: DropdownSelectOption[] = useMemo(() => {
    return [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ];
  }, []);

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = foods.filter((f) => {
      if (categoryId !== "all" && f.foodCategory?.CategoryID !== categoryId) return false;
      if (status === "active" && !f.IsAvailable) return false;
      if (status === "inactive" && f.IsAvailable) return false;
      if (!q) return true;
      const name = (f.DishName ?? "").toLowerCase();
      return name.includes(q);
    });

    const next = [...base].sort((a, b) => {
      if (sortBy === "price_asc") return Number(a.Price) - Number(b.Price);
      if (sortBy === "price_desc") return Number(b.Price) - Number(a.Price);
      const an = (a.DishName ?? "").toLowerCase();
      const bn = (b.DishName ?? "").toLowerCase();
      if (sortBy === "name_desc") return bn.localeCompare(an);
      return an.localeCompare(bn);
    });
    return next;
  }, [foods, search, categoryId, status, sortBy]);

  async function fetchEnterpriseData() {
    try {
      setIsLoading(true);
      setError(null);
      const base = getServerApiBase();
      const res = await fetch(`${base}/enterprise/profile?include=foods`, {
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      });
      if (!res.ok) {
        setError("Failed to fetch enterprise data. Please try again.");
        return;
      }
      const { enterprise } = await res.json();
      setEnterpriseData(enterprise);
    } catch (error) {
      console.error("Error fetching enterprise data:", error);
      setError("Failed to fetch enterprise data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const list = await CategoryService.getAllDebounced();
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshMenus = async () => {
    await fetchEnterpriseData();
  };

  const handleToggleActive = async (food: Food) => {
    try {
      const base = getServerApiBase();
      const payload = {
        FoodID: food.FoodID,
        DishName: food.DishName,
        Description: food.Description,
        Price: Number(food.Price),
        ImageURL: food.ImageURL,
        FoodCategoryID: food.foodCategory.CategoryID,
        IsAvailable: !food.IsAvailable,
      };
      const res = await fetch(`${base}/enterprise/food`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      if (!res.ok) {
        showToast("Failed to update food status", "error");
        return;
      }
      showToast(!food.IsAvailable ? "Food activated" : "Food deactivated", "success", 2500);
      await refreshMenus();
    } catch (e) {
      console.error(e);
      showToast("Failed to update food status", "error");
    }
  };

  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setIsEditPopupOpen(true);
  };

  const handleEditClose = () => {
    setIsEditPopupOpen(false);
    setEditingFood(null);
  };

  const handleEditSuccess = () => {
    refreshMenus();
    handleEditClose();
    showToast('Food item updated successfully', 'success', 3000)
  };

  const handleDelete = async (food: Food) => {
    try {
      // Delete image if exists
      if (food.ImageURL) {
        await deleteImage(food.ImageURL);
      }
      // Delete food item
      const base = getServerApiBase();
      await fetch(`${base}/enterprise/food?foodId=${food.FoodID}`, {
        method: 'DELETE',
        headers: { ...buildAuthHeader() },
        cache: 'no-store',
      });
      await refreshMenus();
      showToast('Food item deleted successfully', 'success', 3000)
    } catch (error) {
      console.error("Error deleting food item:", error);
      setError("Failed to delete food item. Please try again.");
      showToast('Failed to delete food item', 'error', 4000)
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchEnterpriseData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnterprisePageHeader
        title="My Products"
        description="View, edit, and remove dishes in your catalog."
      />

      {/* Delete error display */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">Error deleting image: {deleteError}</p>
        </div>
      )}

      <div className={`${ENTERPRISE_PANEL_CLASS} px-3 py-3 sm:px-4`}>
        <div className="space-y-3 border-b border-gray-200 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by dish name"
                className="h-9 min-h-9 min-w-0 flex-1 rounded-md border-0 bg-white px-3 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto sm:gap-3">
              <DropdownSelect
                value={categoryId}
                onChange={(v) => setCategoryId(v)}
                options={categoryOptions}
                className="w-52 shrink-0"
                menuClassName="min-w-[14rem]"
                aria-label="Filter by category"
              />

              <div className="flex min-w-0 items-center gap-2 sm:min-w-[280px]">
                <span className="shrink-0 text-sm text-gray-600">Sort by:</span>
                <DropdownSelect
                  value={sortBy}
                  onChange={(v) => setSortBy(v as any)}
                  options={sortOptions}
                  className="min-w-0 flex-1"
                  alignMenu="right"
                  menuClassName="min-w-[14rem]"
                  aria-label="Sort products"
                />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <DropdownSelect
                  value={status}
                  onChange={(v) => setStatus(v as any)}
                  options={statusOptions}
                  className="w-44 shrink-0"
                  menuClassName="min-w-[12rem]"
                  aria-label="Filter by status"
                />
                <button
                  type="button"
                  className="h-9 rounded border border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
                  onClick={() => {
                    setSearch("");
                    setCategoryId("all");
                    setStatus("all");
                    setSortBy("name_asc");
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FoodList
        foods={filteredFoods}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {/* Edit Food Popup */}
      {isEditPopupOpen && editingFood && (
        <EditFoodPopup
          food={editingFood}
          isOpen={isEditPopupOpen}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}