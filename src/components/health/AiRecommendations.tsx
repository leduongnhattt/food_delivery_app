'use client'
import React from 'react'
import { type GeminiHealthAnalysis } from '@/services/gemini-health-ai.service'

export default function AiRecommendations({
  items,
}: {
  items: GeminiHealthAnalysis['aiRecommendations']
}) {
  if (!items || items.length === 0) return null

  const priorityBadge = (n: number) => {
    if (n >= 8) return 'bg-red-100 text-red-800'
    if (n >= 5) return 'bg-amber-100 text-amber-800'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-3">✅ AI Recommendations</h4>
      <div className="space-y-3">
        {items
          .slice()
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .map((it, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{it.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {it.type}{it.timeframe ? ` • ${it.timeframe}` : ''}{it.difficulty ? ` • ${it.difficulty}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${priorityBadge(it.priority)}`}>
                  P{it.priority}
                </span>
              </div>

              {it.description ? (
                <p className="mt-2 text-sm text-gray-700">{it.description}</p>
              ) : null}

              {it.expectedOutcome ? (
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Expected:</span> {it.expectedOutcome}
                </p>
              ) : null}

              {it.reasoning ? (
                <p className="mt-2 text-xs text-gray-500">Reasoning: {it.reasoning}</p>
              ) : null}
            </div>
          ))}
      </div>
    </div>
  )
}

