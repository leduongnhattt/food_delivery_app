'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Brain, Loader2 } from 'lucide-react'
import { type HealthProfile } from '@/services/gemini-health-ai.service'

interface HealthFormProps {
  formData: HealthProfile
  isAnalyzing: boolean
  onInputChange: (field: keyof HealthProfile, value: any) => void
  onAnalyze: () => void
}

export default function HealthForm({ formData, isAnalyzing, onInputChange, onAnalyze }: HealthFormProps) {
  return (
    <div className="p-3 sm:p-6 border-r overflow-y-auto lg:col-span-1 h-full">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-600" />
        Health Analysis
      </h3>
      
      <div className="space-y-3 pb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            placeholder="Enter your age"
            value={formData.age || ''}
            onChange={(e) => onInputChange('age', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select 
            value={formData.gender}
            onChange={(e) => onInputChange('gender', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (cm) *
          </label>
          <input
            type="number"
            placeholder="Enter your height"
            value={formData.height || ''}
            onChange={(e) => onInputChange('height', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg) *
          </label>
          <input
            type="number"
            placeholder="Enter your weight"
            value={formData.weight || ''}
            onChange={(e) => onInputChange('weight', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Activity Level *
          </label>
          <select 
            value={formData.activityLevel}
            onChange={(e) => onInputChange('activityLevel', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
          >
            <option value="sedentary">Sedentary (little/no exercise)</option>
            <option value="light">Lightly active (light exercise 1-3 days/week)</option>
            <option value="moderate">Moderately active (moderate exercise 3-5 days/week)</option>
            <option value="active">Very active (hard exercise 6-7 days/week)</option>
            <option value="very-active">Extra active (very hard exercise & physical job)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Health Goals *
          </label>
          <select 
            value={formData.healthGoal}
            onChange={(e) => onInputChange('healthGoal', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
          >
            <option value="weight-loss">Weight Loss</option>
            <option value="weight-gain">Weight Gain</option>
            <option value="muscle-gain">Muscle Gain</option>
            <option value="maintenance">Weight Maintenance</option>
            <option value="health-improvement">General Health Improvement</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dietary Restrictions
          </label>
          <textarea
            placeholder="Any allergies, dietary restrictions, or preferences?"
            value={formData.dietaryRestrictions}
            onChange={(e) => onInputChange('dietaryRestrictions', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500"
            rows={2}
          />
        </div>
        
        <Button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 text-base bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Analyze & Get Recommendations
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
