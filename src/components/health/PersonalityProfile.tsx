'use client'
import React from 'react'
import { type GeminiHealthAnalysis } from '@/services/gemini-health-ai.service'

export default function PersonalityProfile({
  profile,
}: {
  profile: GeminiHealthAnalysis['personalityProfile']
}) {
  if (!profile) return null

  const list = (title: string, items: string[]) => {
    if (!items || items.length === 0) return null
    return (
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((t, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
              {t}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-3">🧩 Personality Profile</h4>
      <div className="space-y-3 text-sm text-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="font-medium">Eating style:</span> {profile.eatingStyle}
          </div>
          <div>
            <span className="font-medium">Motivation:</span> {profile.motivation}
          </div>
        </div>
        {list('Challenges', profile.challenges)}
        {list('Strengths', profile.strengths)}
        {list('Preferences', profile.preferences)}
      </div>
    </div>
  )
}

