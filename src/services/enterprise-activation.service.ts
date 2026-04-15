import { getServerApiBase, requestJson } from '@/lib/http-client'

function base(): string {
  return getServerApiBase().replace(/\/$/, '')
}

function urlActivation(): string {
  return `${base()}/enterprise/activation`
}

export async function verifyEnterpriseInvite(token: string): Promise<{
  success: boolean
  invitation: {
    email: string
    phoneNumber: string
    enterpriseName: string | null
    expiresAt: string
  }
}> {
  return requestJson(`${urlActivation()}/verify-invite?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  })
}

export async function enterpriseActivationStep1(params: {
  token: string
  enterpriseName: string
  password: string
  locale?: string
}): Promise<{ success: boolean }> {
  return requestJson(`${urlActivation()}/step1`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function enterpriseActivationSendOtp(params: {
  token: string
}): Promise<{ success: boolean }> {
  return requestJson(`${urlActivation()}/send-otp`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function enterpriseActivationVerifyOtp(params: {
  token: string
  otp: string
}): Promise<{ success: boolean }> {
  return requestJson(`${urlActivation()}/verify-otp`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function enterpriseActivationStep3(params: {
  token: string
  address: string
  latitude: number
  longitude: number
  openHours: string
  closeHours: string
  description?: string
}): Promise<{ success: boolean; enterprise?: any }> {
  return requestJson(`${urlActivation()}/step3`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

