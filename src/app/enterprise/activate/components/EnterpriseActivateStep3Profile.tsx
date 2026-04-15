"use client"

import { Clock } from "lucide-react"
import EnterpriseLocationPicker from "@/components/admin/enterprises/EnterpriseLocationPicker"

type TimeFieldHandlers = {
  value: string
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void
}

type Step3State = {
  address: string
  latitude: number | null
  longitude: number | null
  openHours: string
  closeHours: string
  description: string
}

type EnterpriseActivateStep3ProfileProps = {
  step3: Step3State
  setStep3: React.Dispatch<React.SetStateAction<Step3State>>
  openTime: TimeFieldHandlers
  closeTime: TimeFieldHandlers
  step3CanFinish: boolean
  isPending: boolean
  onBack: () => void
  onFinish: () => void
}

export function EnterpriseActivateStep3Profile({
  step3,
  setStep3,
  openTime,
  closeTime,
  step3CanFinish,
  isPending,
  onBack,
  onFinish,
}: EnterpriseActivateStep3ProfileProps) {
  return (
    <div className="space-y-4">
      <EnterpriseLocationPicker
        address={step3.address}
        onAddressChange={(nextAddress) => setStep3((p) => ({ ...p, address: nextAddress }))}
        latitude={step3.latitude}
        longitude={step3.longitude}
        onLocationChange={({ latitude, longitude }) =>
          setStep3((p) => ({ ...p, latitude, longitude }))
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Open (HH:mm)</label>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              inputMode="numeric"
              maxLength={5}
              className="border rounded-md h-10 pl-8 pr-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200"
              value={openTime.value}
              onChange={() => {}}
              onKeyDown={openTime.onKeyDown}
              onPaste={openTime.onPaste}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Close (HH:mm)</label>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              inputMode="numeric"
              maxLength={5}
              className="border rounded-md h-10 pl-8 pr-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200"
              value={closeTime.value}
              onChange={() => {}}
              onKeyDown={closeTime.onKeyDown}
              onPaste={closeTime.onPaste}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description (optional)</label>
        <textarea
          className="border rounded-md px-3 py-2 w-full border-slate-200 focus:ring-2 focus:ring-sky-200"
          rows={3}
          value={step3.description}
          onChange={(e) => setStep3((p) => ({ ...p, description: e.target.value }))}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={onBack}
          className="h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          disabled={isPending || !step3CanFinish}
          onClick={() => void onFinish()}
          className="h-10 px-5 rounded-md bg-gradient-to-r from-emerald-600 to-sky-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-sky-700"
        >
          {isPending ? "Activating…" : "Finish activation"}
        </button>
      </div>
    </div>
  )
}
