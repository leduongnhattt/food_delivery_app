'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'
import { type GeminiHealthAnalysis, type HealthProfile } from '@/services/gemini-health-ai.service'
import { BASE_IMAGE_URL } from '@/lib/constants'
import { useToast } from '@/contexts/toast-context'
import { getServerApiBase } from '@/lib/http-client'
import FloatingButton from './FloatingButton'
import HealthForm from './HealthForm'
import RecommendationsDisplay from './RecommendationsDisplay'
import Image from 'next/image'

interface HealthChatbotProps {
  className?: string
}

interface FormErrors {
  age?: string
  height?: string
  weight?: string
}

export default function HealthChatbot({ className = '' }: HealthChatbotProps) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiHealthAnalysis | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<HealthProfile>({
    age: 0,
    gender: 'male',
    height: 0,
    weight: 0,
    activityLevel: 'moderate',
    healthGoal: 'maintenance',
    dietaryRestrictions: ''
  })

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleReset = () => {
    setGeminiAnalysis(null)
    setErrors({})
    setFormData({
      age: 0,
      gender: 'male',
      height: 0,
      weight: 0,
      activityLevel: 'moderate',
      healthGoal: 'maintenance',
      dietaryRestrictions: ''
    })
  }

  const validateField = (field: 'age' | 'height' | 'weight', value: number): string | undefined => {
    // Check range first (this will catch negative numbers and out-of-range values)
    if (field === 'age' && (value < 1 || value > 120)) {
      // If value is 0 or negative, show range error, not required
      return 'Age must be between 1 and 120'
    }
    if (field === 'height' && (value < 50 || value > 250)) {
      return 'Height must be between 50 and 250 cm'
    }
    if (field === 'weight' && (value < 20 || value > 300)) {
      return 'Weight must be between 20 and 300 kg'
    }
    
    // Check if value is empty or zero (only after range check passes)
    if (!value || value === 0) {
      if (field === 'age') return 'Age is required'
      if (field === 'height') return 'Height is required'
      if (field === 'weight') return 'Weight is required'
    }
    
    return undefined
  }

  const isNumericField = (
    field: keyof HealthProfile
  ): field is 'age' | 'height' | 'weight' => field === 'age' || field === 'height' || field === 'weight'

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate age
    const ageError = validateField('age', formData.age)
    if (ageError) newErrors.age = ageError

    // Validate height
    const heightError = validateField('height', formData.height)
    if (heightError) newErrors.height = heightError

    // Validate weight
    const weightError = validateField('weight', formData.weight)
    if (weightError) newErrors.weight = weightError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAnalyze = async () => {
    if (!validateForm()) {
      return
    }

    setIsAnalyzing(true)
    try {
      const base = getServerApiBase()
      const response = await fetch(`${base}/health/gemini-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result: { success?: boolean; data?: GeminiHealthAnalysis; error?: string } = await response.json()
      
      if (result.success) {
        setGeminiAnalysis(result.data ?? null)
        showToast('Health analysis completed successfully!', 'success')
      } else {
        showToast(result.error || 'Error analyzing health data', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast('Error analyzing health data. Please try again.', 'error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleInputChange = <K extends keyof HealthProfile>(field: K, value: HealthProfile[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Validate field in real-time if it's age, height, or weight
    if (isNumericField(field)) {
      const numericValue =
        typeof value === 'number' ? value : Number(value ?? 0)
      const error = validateField(field, numericValue)
      setErrors(prev => {
        if (error) {
          return { ...prev, [field]: error }
        } else {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        }
      })
    } else {
      // Clear error for other fields when user starts typing
      if (errors[field as keyof FormErrors]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field as keyof FormErrors]
          return newErrors
        })
      }
    }
  }

  return (
    <>
      <FloatingButton className={className} onOpen={handleOpen} />

      {/* Health Analysis Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4">
          <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl border-2 border-pink-200 bg-white">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Image 
                    src={`${BASE_IMAGE_URL}/logo.png`}
                    alt="Hanala Food Logo" 
                    width={24}
                    height={24}
                    className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                    priority
                  />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Health Assistant</h2>
                  <p className="text-xs sm:text-sm opacity-90">Your personal nutrition advisor</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <CardContent className="p-0 h-[85vh] flex">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 h-full min-h-0 overflow-hidden">
                <HealthForm 
                  formData={formData}
                  isAnalyzing={isAnalyzing}
                  errors={errors}
                  onInputChange={handleInputChange}
                  onAnalyze={handleAnalyze}
                />
                <RecommendationsDisplay 
                  geminiAnalysis={geminiAnalysis}
                  onReset={handleReset}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
