'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Bell, Shield, Palette, Moon, Sun, Save, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { getServerApiBase } from '@/lib/http-client'

export default function SettingsPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Settings state
  const [settings, setSettings] = useState({
    // Language & Region
    language: 'en',
    timezone: 'Asia/Ho_Chi_Minh',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: false,
    marketing: false,
    
    // Privacy & Security
    profileVisibility: 'public',
    dataSharing: false,
    twoFactorAuth: false,
    
    // Appearance
    theme: 'light',
    fontSize: 'medium'
  })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const base = getServerApiBase()
        const response = await fetch(`${base}/settings`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setSettings(data.settings)
          }
        } else {
          // Fallback: load from localStorage
          const saved = localStorage.getItem('userSettings')
          if (saved) {
            try {
              setSettings(JSON.parse(saved))
            } catch (e) {
              console.error('Error parsing saved settings:', e)
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        // Fallback: load from localStorage
        const saved = localStorage.getItem('userSettings')
        if (saved) {
          try {
            setSettings(JSON.parse(saved))
          } catch (e) {
            console.error('Error parsing saved settings:', e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ]

  const timezones = [
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City (UTC+7)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Asia/Seoul', label: 'Seoul (UTC+9)' },
    { value: 'UTC', label: 'UTC (UTC+0)' }
  ]


  // Auto-save notification settings when changed
  const saveNotificationSettings = async (newSettings: typeof settings) => {
    try {
      const token = localStorage.getItem('access_token')
      const base = getServerApiBase()
      await fetch(`${base}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      })
      // Save to localStorage as backup
      localStorage.setItem('userSettings', JSON.stringify(newSettings))
    } catch (error) {
      console.error('Error auto-saving notification settings:', error)
      // Fallback: save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(newSettings))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const base = getServerApiBase()
      const response = await fetch(`${base}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      // Also save to localStorage as backup
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      // Fallback: save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Update notification setting with auto-save
  const updateNotificationSetting = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    // Auto-save notification preferences
    saveNotificationSettings(newSettings)
  }

  const handleReset = () => {
    setSettings({
      language: 'en',
      timezone: 'Asia/Ho_Chi_Minh',
      emailNotifications: true,
      pushNotifications: true,
      orderUpdates: true,
      promotions: false,
      marketing: false,
      profileVisibility: 'public',
      dataSharing: false,
      twoFactorAuth: false,
      theme: 'light',
      fontSize: 'medium'
    })
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/50">
        <div className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.back()}
                className="mb-6 group flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-white/90 backdrop-blur-sm border border-slate-200/50 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">Back</span>
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                    Settings
                  </h1>
                  <p className="text-slate-600 mt-1">Manage your preferences and account settings</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Language & Region */}
              <Card className="border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-slate-900">Language & Region</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-slate-700 font-medium">Language</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(value) => setSettings({...settings, language: value})}
                      >
                        <SelectTrigger className="w-full h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code} className="cursor-pointer">
                              <div className="flex items-center gap-3 py-1">
                                <span className="text-xl">{lang.flag}</span>
                                <span className="font-medium">{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-slate-700 font-medium">Timezone</Label>
                      <Select 
                        value={settings.timezone} 
                        onValueChange={(value) => setSettings({...settings, timezone: value})}
                      >
                        <SelectTrigger className="w-full h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value} className="cursor-pointer">
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-slate-900">Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Email Notifications</Label>
                      <p className="text-sm text-slate-600 mt-1">Receive notifications via email</p>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Push Notifications</Label>
                      <p className="text-sm text-slate-600 mt-1">Receive push notifications on your device</p>
                    </div>
                    <Switch 
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('pushNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Order Updates</Label>
                      <p className="text-sm text-slate-600 mt-1">Get notified about your order status</p>
                    </div>
                    <Switch 
                      checked={settings.orderUpdates}
                      onCheckedChange={(checked) => updateNotificationSetting('orderUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Promotions</Label>
                      <p className="text-sm text-slate-600 mt-1">Receive promotional offers and discounts</p>
                    </div>
                    <Switch 
                      checked={settings.promotions}
                      onCheckedChange={(checked) => updateNotificationSetting('promotions', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Marketing</Label>
                      <p className="text-sm text-slate-600 mt-1">Receive marketing communications</p>
                    </div>
                    <Switch 
                      checked={settings.marketing}
                      onCheckedChange={(checked) => updateNotificationSetting('marketing', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security */}
              <Card className="border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-slate-900">Privacy & Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility" className="text-slate-700 font-medium">Profile Visibility</Label>
                    <Select 
                      value={settings.profileVisibility} 
                      onValueChange={(value) => setSettings({...settings, profileVisibility: value})}
                    >
                      <SelectTrigger className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public" className="cursor-pointer">Public</SelectItem>
                        <SelectItem value="friends" className="cursor-pointer">Friends Only</SelectItem>
                        <SelectItem value="private" className="cursor-pointer">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Data Sharing</Label>
                      <p className="text-sm text-slate-600 mt-1">Allow sharing data for improved service</p>
                    </div>
                    <Switch 
                      checked={settings.dataSharing}
                      onCheckedChange={(checked) => setSettings({...settings, dataSharing: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-slate-900">Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-600 mt-1">Add an extra layer of security</p>
                    </div>
                    <Switch 
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card className="border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Palette className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-slate-900">Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-slate-700 font-medium">Theme</Label>
                      <Select 
                        value={settings.theme} 
                        onValueChange={(value) => setSettings({...settings, theme: value})}
                      >
                        <SelectTrigger className="w-full h-11 border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light" className="cursor-pointer">
                            <div className="flex items-center gap-3 py-1">
                              <Sun className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark" className="cursor-pointer">
                            <div className="flex items-center gap-3 py-1">
                              <Moon className="w-4 h-4 text-slate-600" />
                              <span className="font-medium">Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="auto" className="cursor-pointer">
                            <div className="flex items-center gap-3 py-1">
                              <Palette className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">Auto</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fontSize" className="text-slate-700 font-medium">Font Size</Label>
                      <Select 
                        value={settings.fontSize} 
                        onValueChange={(value) => setSettings({...settings, fontSize: value})}
                      >
                        <SelectTrigger className="w-full h-11 border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small" className="cursor-pointer">Small</SelectItem>
                          <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
                          <SelectItem value="large" className="cursor-pointer">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="px-6 h-11 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Reset to Defaults
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Settings saved successfully!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
