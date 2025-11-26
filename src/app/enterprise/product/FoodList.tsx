import React from "react";
import FoodRow from "./FoodRow";

// Type definitions based on API response
export interface Food {
  FoodID: string;
  DishName: string;
  Description: string;
  Price: number;
  ImageURL: string;
  IsAvailable?: boolean;
  foodCategory: {
    CategoryID: string;
    CategoryName: string;
  };
}


export interface FoodListProps {
  foods: Food[];
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
}

const FoodList: React.FC<FoodListProps> = ({ foods, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
        <div className="col-span-1">Image</div>
        <div className="col-span-3">Food Name</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Action</div>
      </div>

      {/* Food Rows */}
      {foods.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No foods available.</div>
      ) : (
        foods.map((food) => (
          <FoodRow
            key={food.FoodID}
            food={food}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default FoodList;
