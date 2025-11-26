import React, { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Food } from "./FoodList";
import Image from "next/image";

export interface FoodRowProps {
  food: Food;
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
}

const FoodRow: React.FC<FoodRowProps> = ({ food, onEdit, onDelete }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const handleEdit = () => {
    if (onEdit) {
      onEdit(food);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return
    setConfirmOpen(true)
  };
  const confirmDelete = () => {
    setConfirmOpen(false)
    if (onDelete) {
      onDelete(food)
    }
  }
  const cancelDelete = () => setConfirmOpen(false)

  return (
    <>
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
      {/* Image */}
      <div className="col-span-1">
        {food.ImageURL ? (
          <>
            <Image
              width={48}
              height={48}
              src={food.ImageURL}
              alt={food.DishName}
              className="w-12 h-12 object-cover cursor-zoom-in"
              onClick={() => setPreviewOpen(true)}
            />
            {previewOpen && (
              <div
                className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-2 cursor-zoom-out"
                onClick={() => setPreviewOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={food.ImageURL}
                  alt={food.DishName}
                  className="max-w-[96vw] max-h-[96vh] rounded-2xl shadow-2xl object-contain"
                />
              </div>
            )}
          </>
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* Food Name */}
      <div className="col-span-3">
        <div className="font-medium text-gray-900">{food.DishName}</div>
        {food.Description && (
          <div className="text-sm text-gray-500 truncate">
            {food.Description}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="col-span-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {food.foodCategory.CategoryName}
        </span>
      </div>

      {/* Price */}
      <div className="col-span-2">
        <span className="text-gray-900 font-medium">
          ${food.Price}
        </span>
      </div>

      {/* Availability */}
      <div className="col-span-2">
        {food.IsAvailable ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Selling
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
            Unavailable
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-2">
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
    {confirmOpen && (
      <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
          <div className="px-5 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Confirm deletion</h3>
          </div>
          <div className="px-5 py-4 text-sm text-gray-700">
            Confirm deletion of "{food.DishName}". This action cannot be undone.
          </div>
          <div className="px-5 py-4 flex justify-end gap-2 border-t">
            <button onClick={cancelDelete} className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default FoodRow;
