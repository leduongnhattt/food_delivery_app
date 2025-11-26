'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'
import { type GeminiHealthAnalysis, type HealthProfile } from '@/services/gemini-health-ai.service'
import { BASE_IMAGE_URL } from '@/lib/constants'
import FloatingButton from './FloatingButton'
import HealthForm from './HealthForm'
import RecommendationsDisplay from './RecommendationsDisplay'
import Image from 'next/image'

interface HealthChatbotProps {
  className?: string
}

export default function HealthChatbot({ className = '' }: HealthChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiHealthAnalysis | null>(null)
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

  const handleAnalyze = async () => {
    if (!formData.age || !formData.height || !formData.weight) {
      alert('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/health/gemini-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      if (result.success) {
        setGeminiAnalysis(result.data)
      } else {
        alert('Error analyzing health data: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error analyzing health data')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleInputChange = (field: keyof HealthProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
