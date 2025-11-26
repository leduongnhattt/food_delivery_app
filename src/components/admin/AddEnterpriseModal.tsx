"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Building2, Phone, MapPin, Clock, Eye, EyeOff } from 'lucide-react'
import { validateEnterpriseForm, canProceedStep0 as canStep0, canProceedStep1 as canStep1 } from '@/lib/admin-enterprises-validation'
import { useToast } from '@/contexts/toast-context'
import { useTimeHhmm } from '@/hooks/use-time-hhmm'
import { createEnterprise as createEnterpriseApi } from '@/services/admin-enterprises.service'

export default function AddEnterpriseModal({ triggerClassName = '' }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    enterpriseName: '',
    phoneNumber: '',
    address: '',
    openHours: '00:00',
    closeHours: '00:00',
    description: ''
  })

  const openTime = useTimeHhmm('00:00')
  const closeTime = useTimeHhmm('00:00')
  const [step, setStep] = useState<0 | 1>(0)
  const [showPassword, setShowPassword] = useState(false)

  const onChange = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const errors = useMemo(() => validateEnterpriseForm(form), [form])

  const showError = (key: keyof typeof form) => (submitAttempted || touched[key]) && errors[key]

  useEffect(() => {
    setForm(prev => ({ ...prev, openHours: openTime.value }))
  }, [openTime.value])
  useEffect(() => {
    setForm(prev => ({ ...prev, closeHours: closeTime.value }))
  }, [closeTime.value])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function canProceedStep0() { return canStep0(errors as any) }
  function canProceedStep1() { return canStep1(errors as any) }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitAttempted(true)
    // sync form fields from buffers to ensure submit sends the latest HH:mm
    onChange('openHours', openTime.value)
    onChange('closeHours', closeTime.value)
    if (!canProceedStep0() || !canProceedStep1()) return
    startTransition(async () => {
      const res = await createEnterpriseApi(form)
      if (res.ok) {
        setOpen(false)
        showToast('Enterprise created successfully', 'success', 3000)
        router.replace('/admin/enterprises?status=active')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to create enterprise', 'error', 5000)
      }
    })
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)}>+ Add Enterprise</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden ring-1 ring-slate-900/5">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2"><Building2 className="w-5 h-5" /> Add Enterprise</h3>
                  <p className="text-xs text-cyan-100">Create account and profile for a new enterprise</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white text-lg leading-none">✕</button>
              </div>
              {/* Progress */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className={`h-1.5 rounded-full ${step === 0 ? 'bg-white' : 'bg-white/60'}`} />
                <div className={`h-1.5 rounded-full ${step === 1 ? 'bg-white' : 'bg-white/40'}`} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-cyan-50">
                <span className={`px-2 py-0.5 rounded-full border border-white/40 ${step===0?'bg-white/20':''}`}>Account</span>
                <span>→</span>
                <span className={`px-2 py-0.5 rounded-full border border-white/40 ${step===1?'bg-white/20':''}`}>Enterprise</span>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={onSubmit} className="p-6">
              {step === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                    <div className={`relative ${showError('username') ? 'text-rose-600' : ''}`}>
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('username') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} placeholder="e.g. enterprise_admin" value={form.username} onChange={e=>onChange('username', e.target.value)} onBlur={()=>setTouched(t=>({...t, username:true}))} />
                    </div>
                    {showError('username') && <p className="text-xs text-rose-600 mt-1">{errors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <div className={`relative ${showError('email') ? 'text-rose-600' : ''}`}>
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('email') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} type="email" placeholder="name@company.com" value={form.email} onChange={e=>onChange('email', e.target.value)} onBlur={()=>setTouched(t=>({...t, email:true}))} />
                    </div>
                    {showError('email') && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                    <div className={`relative ${showError('password') ? 'text-rose-600' : ''}`}>
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={`border rounded-md h-10 pl-9 pr-10 w-full ${showError('password') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} type={showPassword ? 'text' : 'password'} placeholder="Minimum 6 characters" value={form.password} onChange={e=>onChange('password', e.target.value)} onBlur={()=>setTouched(t=>({...t, password:true}))} />
                      <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={()=>setShowPassword(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {showError('password') && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Enterprise name</label>
                    <div className={`relative ${showError('enterpriseName') ? 'text-rose-600' : ''}`}>
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('enterpriseName') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} placeholder="Company LLC" value={form.enterpriseName} onChange={e=>onChange('enterpriseName', e.target.value)} onBlur={()=>setTouched(t=>({...t, enterpriseName:true}))} />
                    </div>
                    {showError('enterpriseName') && <p className="text-xs text-rose-600 mt-1">{errors.enterpriseName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                    <div className={`relative ${showError('phoneNumber') ? 'text-rose-600' : ''}`}>
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('phoneNumber') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} placeholder="+84 ..." value={form.phoneNumber} onChange={e=>onChange('phoneNumber', e.target.value)} onBlur={()=>setTouched(t=>({...t, phoneNumber:true}))} />
                    </div>
                    {showError('phoneNumber') && <p className="text-xs text-rose-600 mt-1">{errors.phoneNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                    <div className={`relative ${showError('address') ? 'text-rose-600' : ''}`}>
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('address') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} placeholder="Street, City" value={form.address} onChange={e=>onChange('address', e.target.value)} onBlur={()=>setTouched(t=>({...t, address:true}))} />
                    </div>
                    {showError('address') && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Open (HH:mm)</label>
                    <div className={`relative ${showError('openHours') ? 'text-rose-600' : ''}`}>
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input inputMode="numeric" maxLength={5} className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('openHours') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} placeholder="00:00" value={openTime.value} onChange={()=>{}} onKeyDown={openTime.onKeyDown} onPaste={openTime.onPaste} onBlur={()=>setTouched(t=>({...t, openHours:true}))} />
                    </div>
                    {showError('openHours') && <p className="text-xs text-rose-600 mt-1">{errors.openHours}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Close (HH:mm)</label>
                    <div className={`relative ${showError('closeHours') ? 'text-rose-600' : ''}`}>
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input inputMode="numeric" maxLength={5} className={`border rounded-md h-10 pl-9 pr-3 w-full ${showError('closeHours') ? 'border-rose-300' : 'border-slate-200'} focus:ring-2 focus:ring-cyan-200`} placeholder="00:00" value={closeTime.value} onChange={()=>{}} onKeyDown={closeTime.onKeyDown} onPaste={closeTime.onPaste} onBlur={()=>setTouched(t=>({...t, closeHours:true}))} />
                    </div>
                    {showError('closeHours') && <p className="text-xs text-rose-600 mt-1">{errors.closeHours}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea className="border rounded-md px-3 py-2 w-full border-slate-200 focus:ring-2 focus:ring-cyan-200" rows={3} placeholder="Short description" value={form.description} onChange={e=>onChange('description', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="mt-6 flex items-center justify-between">
                <button type="button" onClick={()=>setOpen(false)} className="h-10 px-4 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
                <div className="flex items-center gap-2">
                  {step === 1 && (
                    <button type="button" onClick={()=>setStep(0)} className="h-10 px-4 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50">Back</button>
                  )}
                  {step === 0 ? (
                    <button type="button" onClick={()=>{ if (canProceedStep0()) { setStep(1) } }} className="h-10 px-4 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60" disabled={!canProceedStep0()}>Next</button>
                  ) : (
                    <button disabled={isPending || !canProceedStep1()} type="submit" className="h-10 px-5 rounded-md bg-gradient-to-r from-cyan-600 to-teal-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:from-cyan-700 hover:to-teal-700">{isPending ? 'Creating…' : 'Create'}</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}



