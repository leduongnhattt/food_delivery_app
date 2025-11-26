import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { validateProfileForm, type ValidationResult } from '@/lib/validation'
import { useState, useEffect } from 'react'

interface ProfileFormProps {
  profileData: {
    fullName: string
    email: string
    phone: string
    address: string
  }
  isEditing: boolean
  onFieldChange: (field: string, value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function ProfileForm({ profileData, isEditing, onFieldChange, onSave, onCancel }: ProfileFormProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, ValidationResult>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Validate form whenever profileData changes
  useEffect(() => {
    const validationResults = validateProfileForm(profileData)
    setValidationErrors(validationResults)
    setIsFormValid(Object.values(validationResults).every(result => result.isValid))
  }, [profileData])

  const getFieldError = (field: string): string | null => {
    return validationErrors[field]?.errors[0] || null
  }

  const getFieldClassName = (field: string): string => {
    const baseClass = "border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg"
    const errorClass = validationErrors[field]?.isValid === false ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
    return `${baseClass} ${errorClass}`
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
          <Input 
            value={profileData.fullName}
            onChange={(e) => onFieldChange('fullName', e.target.value)}
            disabled={!isEditing}
            className={getFieldClassName('fullName')}
          />
          {getFieldError('fullName') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('fullName')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
          <Input 
            value={profileData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            disabled={!isEditing}
            className={getFieldClassName('email')}
          />
          {getFieldError('email') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('email')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Phone Number</label>
          <Input 
            value={profileData.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            disabled={!isEditing}
            className={getFieldClassName('phone')}
          />
          {getFieldError('phone') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('phone')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Address</label>
          <Input 
            value={profileData.address}
            onChange={(e) => onFieldChange('address', e.target.value)}
            disabled={!isEditing}
            className={getFieldClassName('address')}
          />
          {getFieldError('address') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('address')}</p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className={`${isFormValid ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
            onClick={onSave}
            disabled={!isFormValid}
          >
            Save Changes
          </Button>
        </div>
      )}
    </>
  )
}

