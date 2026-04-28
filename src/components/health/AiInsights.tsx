'use client'
import React from 'react'
import { type GeminiHealthAnalysis } from '@/services/gemini-health-ai.service'

export default function AiInsights({ items }: { items: GeminiHealthAnalysis['aiInsights'] }) {
  if (!items || items.length === 0) return null

  const badge = (p: 'high' | 'medium' | 'low') => {
    if (p === 'high') return 'bg-red-100 text-red-800'
    if (p === 'medium') return 'bg-amber-100 text-amber-800'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <h4 className="font-semibold text-gray-800 mb-3">🧠 AI Insights</h4>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{it.category}</p>
                <p className="mt-1 text-sm text-gray-700">{it.insight}</p>
              </div>
              <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${badge(it.priority)}`}>
                {it.priority}
              </span>
            </div>

            {it.actionable ? (
              <div className="mt-2 text-sm text-gray-700">
                <span className="font-medium">Action:</span> {it.actionable}
              </div>
            ) : null}

            {(it.reasoning || it.confidence != null) ? (
              <div className="mt-2 text-xs text-gray-500">
                {it.reasoning ? <span className="mr-2">Reasoning: {it.reasoning}</span> : null}
                {typeof it.confidence === 'number' ? (
                  <span>Confidence: {Math.round(it.confidence * 100)}%</span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

