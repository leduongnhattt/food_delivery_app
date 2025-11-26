'use client'
import React from 'react'
import { type FoodRecommendation } from '@/services/gemini-health-ai.service'

interface FoodRecommendationsProps {
  foods: FoodRecommendation[]
}

export default function FoodRecommendations({ foods }: FoodRecommendationsProps) {
  if (foods.length === 0) return null

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-4">🍎 Food Recommendations</h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-green-100 to-blue-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 text-sm">Category</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 text-sm">Recommended Foods</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 text-sm">Avoid</th>
            </tr>
          </thead>
          <tbody>
            {foods.map((food, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium text-gray-800 bg-gray-50 text-sm">
                  {food.category}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(food.eat) ? food.eat.map((item, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {item}
                      </span>
                    )) : (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {food.eat}
                      </span>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(food.avoid) ? food.avoid.map((item, idx) => (
                      <span key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {item}
                      </span>
                    )) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {food.avoid}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
