import React, { useState } from "react";
import { Food } from "./FoodList";
import Image from "next/image";

export interface FoodRowProps {
  food: Food;
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
  onToggleActive?: (food: Food) => void;
}

const FoodRow: React.FC<FoodRowProps> = ({ food, onEdit, onDelete, onToggleActive }) => {
  const [, setPreviewOpen] = useState(false)
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
    <div className="overflow-hidden rounded border border-gray-200 bg-white">
      <div className="grid grid-cols-12 gap-4 px-4 py-3">
        {/* Dish */}
        <div className="col-span-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              {food.ImageURL ? (
                <Image
                  width={56}
                  height={56}
                  src={food.ImageURL}
                  alt={food.DishName}
                  className="h-full w-full object-cover cursor-zoom-in"
                  onClick={() => setPreviewOpen(true)}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                {food.DishName}
              </p>
              {food.Description ? (
                <p className="mt-1 text-xs leading-normal text-gray-500 line-clamp-2">
                  {food.Description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="col-span-2">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            {food.foodCategory.CategoryName}
          </span>
        </div>

        {/* Price */}
        <div className="col-span-2">
          <span className="text-base font-semibold text-[#0070f0] tabular-nums whitespace-nowrap">
            ${food.Price}
          </span>
        </div>

        {/* Status */}
        <div className="col-span-1">
          {food.IsAvailable ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Inactive
            </span>
          )}
        </div>

        {/* Updated */}
        <div className="col-span-2 text-sm text-gray-600">
          {food.UpdatedAt ? new Date(food.UpdatedAt).toLocaleString() : "—"}
        </div>

        {/* Actions */}
        <div className="col-span-1">
          <div className="flex flex-col items-start gap-1">
            {onEdit ? (
              <button
                onClick={handleEdit}
                className="text-sm font-medium text-[#0070f0] hover:text-[#0050c0] hover:underline"
              >
                Edit
              </button>
            ) : null}
            {onToggleActive ? (
              <button
                type="button"
                onClick={() => onToggleActive(food)}
                className="text-sm font-medium text-[#0070f0] hover:text-[#0050c0] hover:underline"
              >
                {food.IsAvailable ? "Deactivate" : "Activate"}
              </button>
            ) : null}
            {onDelete ? (
              <button
                onClick={handleDelete}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            ) : null}
          </div>
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
