import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ProfileHeaderProps {
  onBack: () => void
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 px-4 shadow-sm flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back</span>
      </Button>
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
    </div>
  )
}

