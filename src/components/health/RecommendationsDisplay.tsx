'use client'
import React from 'react'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type GeminiHealthAnalysis } from '@/services/gemini-health-ai.service'
import HealthAnalysis from './HealthAnalysis'
import ExerciseRecommendations from './ExerciseRecommendations'
import FoodRecommendations from './FoodRecommendations'
import MealPlan from './MealPlan'

interface RecommendationsDisplayProps {
  geminiAnalysis: GeminiHealthAnalysis | null
  onReset: () => void
}

export default function RecommendationsDisplay({ geminiAnalysis, onReset }: RecommendationsDisplayProps) {
  return (
    <div className="bg-gray-50 h-full flex flex-col overflow-auto lg:col-span-2">
      <div className="p-3 sm:p-6 pb-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            Your Personalized Recommendations
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0">
        {geminiAnalysis ? (
          <div className="space-y-4 pr-2">
            <HealthAnalysis analysis={geminiAnalysis.analysis} />
            <ExerciseRecommendations exercises={geminiAnalysis.exerciseRecommendations} />
            <FoodRecommendations foods={geminiAnalysis.foodRecommendations} />
            <MealPlan mealPlan={geminiAnalysis.weeklyMealPlan} />
            
            {/* Basic Recommendations */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">📋 Basic Recommendations</h4>
              <ul className="space-y-1">
                {geminiAnalysis.analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pr-2">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">💡 Health Insights</h4>
              <p className="text-sm text-gray-600">
                Fill in your health information to get personalized nutrition insights and meal recommendations.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">🍽️ Recommended Meals</h4>
              <p className="text-sm text-gray-600">
                Based on your profile, we'll suggest the best meals for your health goals.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">📊 Nutrition Analysis</h4>
              <p className="text-sm text-gray-600">
                Get detailed breakdown of calories, macros, and micronutrients.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
