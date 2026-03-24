'use client'
import React from 'react'
import { type ExerciseRecommendation } from '@/services/gemini-health-ai.service'

interface ExerciseRecommendationsProps {
  exercises: ExerciseRecommendation[]
}

export default function ExerciseRecommendations({ exercises }: ExerciseRecommendationsProps) {
  if (exercises.length === 0) return null

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-3">🏃‍♂️ Exercise Recommendations</h4>
      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">{exercise.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                exercise.difficultyLevel === 'Beginner' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700' :
                exercise.difficultyLevel === 'Intermediate' ? 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700' :
                'bg-gradient-to-r from-red-100 to-orange-100 text-red-700'
              }`}>
                {exercise.difficultyLevel}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
              <div><span className="font-medium">Duration:</span> {exercise.duration}</div>
              <div><span className="font-medium">Frequency:</span> {exercise.frequency}</div>
              <div><span className="font-medium">Equipment:</span> {exercise.equipment}</div>
              <div>
                <span className="font-medium">Guide:</span> 
                <a href={exercise.tutorialLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-800 hover:underline ml-1">
                  Read →
                </a>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Benefits:</p>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(exercise.benefits) ? exercise.benefits.map((benefit, idx) => (
                  <span key={idx} className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 px-2 py-1 rounded">
                    {benefit}
                  </span>
                )) : (
                  <span className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 px-2 py-1 rounded">
                    {exercise.benefits}
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Instructions:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {Array.isArray(exercise.instructions) ? exercise.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>{instruction}</span>
                  </li>
                )) : (
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>{exercise.instructions}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
