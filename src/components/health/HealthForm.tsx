'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Brain, Loader2 } from 'lucide-react'
import { type HealthProfile } from '@/services/gemini-health-ai.service'
import {
  DropdownSelect,
  type DropdownSelectOption,
} from '@/components/ui/dropdown-select'

interface FormErrors {
  age?: string
  height?: string
  weight?: string
}

interface HealthFormProps {
  formData: HealthProfile
  isAnalyzing: boolean
  errors?: FormErrors
  onInputChange: (field: keyof HealthProfile, value: any) => void
  onAnalyze: () => void
}

export default function HealthForm({ formData, isAnalyzing, errors = {}, onInputChange, onAnalyze }: HealthFormProps) {
  const genderOptions: DropdownSelectOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]

  const activityOptions: DropdownSelectOption[] = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
    { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)' },
    { value: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)' },
    { value: 'active', label: 'Very active (hard exercise 6-7 days/week)' },
    { value: 'very-active', label: 'Extra active (very hard exercise & physical job)' },
  ]

  const goalOptions: DropdownSelectOption[] = [
    { value: 'weight-loss', label: 'Weight Loss' },
    { value: 'weight-gain', label: 'Weight Gain' },
    { value: 'muscle-gain', label: 'Muscle Gain' },
    { value: 'maintenance', label: 'Weight Maintenance' },
    { value: 'health-improvement', label: 'General Health Improvement' },
  ]

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
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${
              errors.age 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-purple-500'
            }`}
            min="1"
            max="120"
          />
          {errors.age && (
            <p className="mt-1 text-xs text-red-600">{errors.age}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <DropdownSelect
            value={formData.gender}
            onChange={(value) => onInputChange('gender', value)}
            options={genderOptions}
            className="w-full"
            usePortal
            aria-label="Select gender"
          />
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
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${
              errors.height 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-purple-500'
            }`}
            min="50"
            max="250"
          />
          {errors.height && (
            <p className="mt-1 text-xs text-red-600">{errors.height}</p>
          )}
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
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${
              errors.weight 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-purple-500'
            }`}
            min="20"
            max="300"
          />
          {errors.weight && (
            <p className="mt-1 text-xs text-red-600">{errors.weight}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Activity Level *
          </label>
          <DropdownSelect
            value={formData.activityLevel}
            onChange={(value) => onInputChange('activityLevel', value)}
            options={activityOptions}
            className="w-full"
            menuClassName="min-w-[18rem]"
            usePortal
            aria-label="Select activity level"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Health Goals *
          </label>
          <DropdownSelect
            value={formData.healthGoal}
            onChange={(value) => onInputChange('healthGoal', value)}
            options={goalOptions}
            className="w-full"
            menuClassName="min-w-[18rem]"
            usePortal
            aria-label="Select health goal"
          />
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
          className="w-full py-3 text-base bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
