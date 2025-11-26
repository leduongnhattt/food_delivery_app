'use client'
import React from 'react'
import { CheckCircle } from 'lucide-react'
import { type GeminiHealthAnalysis } from '@/services/gemini-health-ai.service'

interface HealthAnalysisProps {
  analysis: GeminiHealthAnalysis['analysis']
}

export default function HealthAnalysis({ analysis }: HealthAnalysisProps) {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        Health Analysis
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="font-medium">BMI:</span> {analysis.bmi.toFixed(1)} ({analysis.bmiCategory})
        </div>
        <div>
          <span className="font-medium">Daily Calories:</span> {analysis.recommendedCalories}
        </div>
        <div>
          <span className="font-medium">Protein:</span> {analysis.macronutrients.protein}g
        </div>
        <div>
          <span className="font-medium">Carbs:</span> {analysis.macronutrients.carbs}g
        </div>
        <div>
          <span className="font-medium">Fat:</span> {analysis.macronutrients.fat}g
        </div>
      </div>
      
      {/* Health Status */}
      <div className="bg-gray-50 p-3 rounded-lg mb-3">
        <h5 className="font-medium text-gray-800 mb-2">Health Status</h5>
        <p className="text-sm text-gray-700">{analysis.healthStatus}</p>
      </div>

      {/* Health Risks */}
      {analysis.healthRisks.length > 0 && (
        <div className="bg-red-50 p-3 rounded-lg mb-3">
          <h5 className="font-medium text-red-800 mb-2">Health Risks</h5>
          <ul className="text-sm text-red-700">
            {analysis.healthRisks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
