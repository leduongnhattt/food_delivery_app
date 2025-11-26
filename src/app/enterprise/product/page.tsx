'use client'
import { apiClient, type ApiResponse } from "@/services/api"
import { useEffect, useState } from "react"
import FoodList, { Food } from "./FoodList";
import { useEnterpriseUpload } from "@/hooks/use-enterprise-upload";
import EditFoodPopup from "./EditFoodPopup";
import { useToast } from "@/contexts/toast-context";

const isApiError = (response: unknown): response is ApiResponse => {
  return !!response && typeof response === "object" && "success" in response && (response as ApiResponse).success === false;
};

export default function AdminDashboardPage() {
  const [entepriseData, setEnterpriseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  
  const { deleteImage, deleteError } = useEnterpriseUpload();
  const { showToast } = useToast();

  async function fetchEnterpriseData() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ enterprise: any }>(
        "/enterprise/profile?include=foods"
      );

      if (isApiError(response)) {
        console.error("Error fetching enterprise data:", response.error);
        setError("Failed to fetch enterprise data. Please try again.");
        return;
      }

      const { enterprise } = response;
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

  const refreshMenus = async () => {
    await fetchEnterpriseData();
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
      await apiClient.delete(`/enterprise/food?foodId=${food.FoodID}`);
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Product</h1>
      
      {/* Delete error display */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">Error deleting image: {deleteError}</p>
        </div>
      )}

      <FoodList
        foods={entepriseData?.foods ?? []}
        onEdit={handleEdit}
        onDelete={handleDelete}
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