"use client"

import { useState } from 'react'
import { Tag, Percent, Calendar, Sparkles } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

export default function AdminCreateVoucherForm({ onCreated }: { onCreated?: () => void }) {
  const { showToast } = useToast()
  const [couponCode, setCouponCode] = useState('')
  const [expire, setExpire] = useState('')
  const [percentDiscount, setPercentDiscount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [maxUsage, setMaxUsage] = useState('')
  const [discountType, setDiscountType] = useState<'percent'|'amount'>('percent')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({ couponCode:'', expire:'', percentDiscount:'', discountAmount:'', minOrderValue:'', maxUsage:'' })

  function validate(): boolean {
    const e = { couponCode:'', expire:'', percentDiscount:'', discountAmount:'', minOrderValue:'', maxUsage:'' }
    if (!couponCode.trim()) e.couponCode = 'Coupon code is required'
    if (!expire.trim()) e.expire = 'Expire date is required'
    if (discountType === 'percent') {
      if (!percentDiscount.trim()) e.percentDiscount = 'Percent discount is required'
    } else {
      if (!discountAmount.trim()) e.discountAmount = 'Discount amount is required'
    }
    setErrors(e)
    return Object.values(e).every(v => v === '')
  }

  async function handleCreate() {
    if (!validate()) return
    setLoading(true)
    try {
      const payload: any = { Code: couponCode.trim(), ExpiryDate: expire }
      if (discountType === 'percent') payload.DiscountPercent = parseFloat(percentDiscount)
      else payload.DiscountAmount = parseFloat(discountAmount)
      if (minOrderValue.trim()) payload.MinOrderValue = parseFloat(minOrderValue)
      if (maxUsage.trim()) payload.MaxUsage = parseInt(maxUsage)
      const res = await fetch('/api/admin/voucher', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to create voucher')
      showToast('Voucher created successfully', 'success')
      setCouponCode(''); setExpire(''); setPercentDiscount(''); setDiscountAmount(''); setMinOrderValue(''); setMaxUsage('')
      onCreated?.()
    } catch (e:any) {
      showToast(e?.message || 'Failed to create voucher', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-purple-100 p-2"><Sparkles className="h-5 w-5 text-purple-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Create New Voucher</h3>
          <p className="text-sm text-gray-500">Set up discount codes for your customers</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700"><Tag className="mr-2 inline h-4 w-4" />Coupon Code</label>
          <input value={couponCode} onChange={e=>setCouponCode(e.target.value)} className={`w-full rounded-lg border px-4 py-3 ${errors.couponCode?'border-red-300':'border-gray-300'} focus:ring-2 focus:ring-purple-500`} placeholder="e.g., SAVE20, WELCOME10" />
          {errors.couponCode && <p className="mt-1 text-sm text-red-500">{errors.couponCode}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Discount Type</label>
          <div className="flex gap-2">
            <button type="button" onClick={()=>setDiscountType('percent')} className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${discountType==='percent'?'border-purple-500 bg-purple-50 text-purple-700':'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}><Percent className="mr-2 inline h-4 w-4" />Percentage</button>
            <button type="button" onClick={()=>setDiscountType('amount')} className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${discountType==='amount'?'border-purple-500 bg-purple-50 text-purple-700':'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}><Tag className="mr-2 inline h-4 w-4" />Fixed Amount</button>
          </div>
        </div>

        {discountType==='percent' ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700"><Percent className="mr-2 inline h-4 w-4" />Discount Percentage</label>
            <div className="relative">
              <input type="number" min="0" max="100" step="0.01" value={percentDiscount} onChange={e=>setPercentDiscount(e.target.value)} className={`w-full rounded-lg border px-4 py-3 pr-8 ${errors.percentDiscount?'border-red-300':'border-gray-300'} focus:ring-2 focus:ring-purple-500`} placeholder="0.00" />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">%</div>
            </div>
            {errors.percentDiscount && <p className="mt-1 text-sm text-red-500">{errors.percentDiscount}</p>}
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700"><Tag className="mr-2 inline h-4 w-4" />Discount Amount</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</div>
              <input type="number" min="0" step="0.01" value={discountAmount} onChange={e=>setDiscountAmount(e.target.value)} className={`w-full rounded-lg border px-4 py-3 pl-8 ${errors.discountAmount?'border-red-300':'border-gray-300'} focus:ring-2 focus:ring-purple-500`} placeholder="0.00" />
            </div>
            {errors.discountAmount && <p className="mt-1 text-sm text-red-500">{errors.discountAmount}</p>}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700"><Tag className="mr-2 inline h-4 w-4" />Minimum Order Value (Optional)</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</div>
            <input type="number" min="0" step="0.01" value={minOrderValue} onChange={e=>setMinOrderValue(e.target.value)} className={`w-full rounded-lg border px-4 py-3 pl-8 ${errors.minOrderValue?'border-red-300':'border-gray-300'} focus:ring-2 focus:ring-purple-500`} placeholder="0.00" />
          </div>
          {errors.minOrderValue && <p className="mt-1 text-sm text-red-500">{errors.minOrderValue}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700"><Tag className="mr-2 inline h-4 w-4" />Max Usage (Optional)</label>
          <input type="number" min="1" value={maxUsage} onChange={e=>setMaxUsage(e.target.value)} className={`w-full rounded-lg border px-4 py-3 ${errors.maxUsage?'border-red-300':'border-gray-300'} focus:ring-2 focus:ring-purple-500`} placeholder="Unlimited" />
          <p className="mt-1 text-xs text-gray-500">Maximum number of times this voucher can be used. Leave empty for unlimited usage.</p>
          {errors.maxUsage && <p className="mt-1 text-sm text-red-500">{errors.maxUsage}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700"><Calendar className="mr-2 inline h-4 w-4" />Expiry Date</label>
          <input type="date" value={expire} onChange={e=>setExpire(e.target.value)} className={`w-full rounded-lg border px-4 py-3 ${errors.expire?'border-red-300':'border-gray-300'} focus:ring-2 focus:ring-purple-500`} />
          {errors.expire && <p className="mt-1 text-sm text-red-500">{errors.expire}</p>}
        </div>

        <button onClick={handleCreate} disabled={loading} className="w-full rounded-lg bg-purple-600 text-white py-3 hover:bg-purple-700 disabled:bg-gray-300">{loading ? 'Creating...' : 'Create Voucher'}</button>
      </div>
    </div>
  )
}



