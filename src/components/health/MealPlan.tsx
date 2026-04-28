'use client'
import React from 'react'
import { type MealPlan } from '@/services/gemini-health-ai.service'

interface MealPlanProps {
  mealPlan: MealPlan[]
}

export default function MealPlan({ mealPlan }: MealPlanProps) {
  if (mealPlan.length === 0) return null

  const splitItems = (text: unknown): string[] => {
    const t = String(text ?? '').trim()
    if (!t) return []
    return t
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-4">📅 7-Day Meal Plan</h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-yellow-100 to-orange-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Day</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Breakfast</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Lunch</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Dinner</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Snack</th>
            </tr>
          </thead>
          <tbody>
            {mealPlan.map((day, index) => {
              // Support both schemas:
              // 1) { breakfast: { meal, calories } }
              // 2) { meals: { breakfast: { name, calories } } }
              const hasMealsObject = (day as any).meals && typeof (day as any).meals === 'object'
              const b = hasMealsObject ? (day as any).meals.breakfast : (day as any).breakfast
              const l = hasMealsObject ? (day as any).meals.lunch : (day as any).lunch
              const d = hasMealsObject ? (day as any).meals.dinner : (day as any).dinner
              const s = hasMealsObject ? (day as any).meals.snack : (day as any).snack
              const getCals = (m: any) => (m?.calories ?? '')
              const getDesc = (m: any) => (m?.description ?? m?.desc ?? '')
              return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium text-gray-800 bg-gray-50">
                  {day.day}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="space-y-1">
                    {getDesc(b) ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {splitItems(getDesc(b)).map((item, i) => (
                          <li key={i} className="text-xs text-gray-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No meal details</p>
                    )}
                    <p className="text-xs text-gray-600">({getCals(b)} cal)</p>
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="space-y-1">
                    {getDesc(l) ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {splitItems(getDesc(l)).map((item, i) => (
                          <li key={i} className="text-xs text-gray-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No meal details</p>
                    )}
                    <p className="text-xs text-gray-600">({getCals(l)} cal)</p>
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="space-y-1">
                    {getDesc(d) ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {splitItems(getDesc(d)).map((item, i) => (
                          <li key={i} className="text-xs text-gray-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No meal details</p>
                    )}
                    <p className="text-xs text-gray-600">({getCals(d)} cal)</p>
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="space-y-1">
                    {getDesc(s) ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {splitItems(getDesc(s)).map((item, i) => (
                          <li key={i} className="text-xs text-gray-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No meal details</p>
                    )}
                    <p className="text-xs text-gray-600">({getCals(s)} cal)</p>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}
