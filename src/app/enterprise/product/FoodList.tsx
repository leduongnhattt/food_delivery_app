"use client";

import React, { useEffect, useMemo, useState } from "react";
import FoodRow from "./FoodRow";
import { CardTable } from "@/components/ui/card-table";

// Type definitions based on API response
export interface Food {
  FoodID: string;
  DishName: string;
  Description: string;
  Price: number;
  ImageURL: string;
  Stock?: number;
  IsAvailable?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string | null;
  foodCategory: {
    CategoryID: string;
    CategoryName: string;
  };
}


export interface FoodListProps {
  foods: Food[];
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
  onToggleActive?: (food: Food) => void;
}

const FoodList: React.FC<FoodListProps> = ({ foods, onEdit, onDelete, onToggleActive }) => {
  const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);

  useEffect(() => {
    setPage(1);
  }, [foods]);

  const pagedFoods = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(foods.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return foods.slice(start, start + pageSize);
  }, [foods, page, pageSize]);

  return (
    <CardTable
      header={
        <div className="px-4 py-3">
          <div className="grid grid-cols-12 gap-4 text-sm text-gray-900">
            <div className="col-span-4 font-medium">Dish</div>
            <div className="col-span-2 font-medium">Category</div>
            <div className="col-span-2 font-medium">Price</div>
            <div className="col-span-1 font-medium">Status</div>
            <div className="col-span-2 font-medium">Updated</div>
            <div className="col-span-1 font-medium">Actions</div>
          </div>
        </div>
      }
      isEmpty={foods.length === 0}
      emptyState={
        <div className="bg-white py-12 text-center text-sm text-gray-500">
          No foods match the current filters.
        </div>
      }
      pagination={
        foods.length > 0
          ? {
              page,
              pageSize,
              total: foods.length,
              onPageChange: (n) => setPage(n),
              onPageSizeChange: (n) => {
                setPageSize(n as any);
                setPage(1);
              },
              pageSizeOptions: PAGE_SIZE_OPTIONS,
            }
          : null
      }
    >
      <div className="space-y-3 px-4 py-3">
        {pagedFoods.map((food) => (
          <FoodRow
            key={food.FoodID}
            food={food}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
      </div>
    </CardTable>
  );
};

export default FoodList;
