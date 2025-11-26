'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Globe, Bell, Shield, User, Palette, Moon, Sun, Save, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'

export default function SettingsPage() {
  const router = useRouter()
  const isEditing = true
  const [showPassword, setShowPassword] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    // Language & Region
    language: 'vi',
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
    fontSize: 'medium',
    
    // Account
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

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


  const handleSave = () => {
    // TODO: Implement save settings to backend
    console.log('Saving settings:', settings)
    // Show success message
    alert('Settings saved successfully!')
  }

  const handleReset = () => {
    // TODO: Implement reset to defaults
    console.log('Resetting settings')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Settings
              </h1>
            </div>

            <div className="space-y-8">
              {/* Language & Region */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-500" />
                    Language & Region
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(value) => setSettings({...settings, language: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={settings.timezone} 
                        onValueChange={(value) => setSettings({...settings, timezone: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
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
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Push Notifications</Label>
                      <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                    </div>
                    <Switch 
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Order Updates</Label>
                      <p className="text-sm text-gray-600">Get notified about your order status</p>
                    </div>
                    <Switch 
                      checked={settings.orderUpdates}
                      onCheckedChange={(checked) => setSettings({...settings, orderUpdates: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Promotions</Label>
                      <p className="text-sm text-gray-600">Receive promotional offers and discounts</p>
                    </div>
                    <Switch 
                      checked={settings.promotions}
                      onCheckedChange={(checked) => setSettings({...settings, promotions: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Marketing</Label>
                      <p className="text-sm text-gray-600">Receive marketing communications</p>
                    </div>
                    <Switch 
                      checked={settings.marketing}
                      onCheckedChange={(checked) => setSettings({...settings, marketing: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    Privacy & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="profileVisibility">Profile Visibility</Label>
                    <Select 
                      value={settings.profileVisibility} 
                      onValueChange={(value) => setSettings({...settings, profileVisibility: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Data Sharing</Label>
                      <p className="text-sm text-gray-600">Allow sharing data for improved service</p>
                    </div>
                    <Switch 
                      checked={settings.dataSharing}
                      onCheckedChange={(checked) => setSettings({...settings, dataSharing: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <Switch 
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-orange-500" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select 
                        value={settings.theme} 
                        onValueChange={(value) => setSettings({...settings, theme: value})}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4" />
                              <span>Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4" />
                              <span>Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="auto">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              <span>Auto</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Select 
                        value={settings.fontSize} 
                        onValueChange={(value) => setSettings({...settings, fontSize: value})}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={settings.currentPassword}
                        onChange={(e) => setSettings({...settings, currentPassword: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={settings.newPassword}
                      onChange={(e) => setSettings({...settings, newPassword: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={settings.confirmPassword}
                      onChange={(e) => setSettings({...settings, confirmPassword: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="px-6"
                >
                  Reset to Defaults
                </Button>
                <Button
                  onClick={handleSave}
                  className="px-6 bg-orange-500 hover:bg-orange-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
