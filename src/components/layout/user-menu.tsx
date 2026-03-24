'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAccountHeader } from '@/hooks/use-account-header'

type UserLike = {
  username?: string | null
  email?: string | null
}

export function UserMenu(props: {
  user: UserLike | null | undefined
  onLogout: () => void
  profileHref?: string
  settingsHref?: string
}) {
  const { user, onLogout, profileHref = '/profile', settingsHref = '/settings' } = props
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const accountHeader = useAccountHeader()
  const ref = useRef<HTMLDivElement | null>(null)
  

  function handleProfile() {
    setIsOpen(false)
    router.push(profileHref)
  }

  function handleSettings() {
    setIsOpen(false)
    router.push(settingsHref)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!isOpen) return
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen])

  // No local fetch - rely on shared account header hook

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-400 text-white shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:brightness-105 hover:shadow-xl ${isOpen ? 'ring-orange-500' : 'ring-transparent'}`}
      >
        <span className="sr-only">Open profile menu</span>
        {accountHeader.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={accountHeader.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-sm font-bold">
            {(user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </span>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-1 ring-white" aria-hidden="true"></span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-black/10 bg-white shadow-2xl z-50"
        >
          <div className="px-4 py-3 text-xs text-gray-700 bg-gray-50">
            <div className="font-medium text-gray-900 text-sm truncate">{user?.username || user?.email || 'User'}</div>
            <div className="truncate">{user?.email || ''}</div>
          </div>
          <div className="py-1">
            <button
              role="menuitem"
              onClick={handleProfile}
              className="group w-full px-4 py-2 text-left text-sm flex items-center gap-3 text-gray-900 hover:bg-amber-100 hover:font-medium transition-all"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-transform group-hover:scale-105">👤</span>
              <span className="transition-transform group-hover:translate-x-0.5">Profile</span>
            </button>
            <button
              role="menuitem"
              onClick={handleSettings}
              className="group w-full px-4 py-2 text-left text-sm flex items-center gap-3 text-gray-900 hover:bg-amber-100 hover:font-medium transition-all"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-transform group-hover:rotate-6">⚙️</span>
              <span className="transition-transform group-hover:translate-x-0.5">Settings</span>
            </button>
            <div className="my-1 border-t" />
            <button
              role="menuitem"
              onClick={() => { setIsOpen(false); onLogout() }}
              className="group w-full px-4 py-2 text-left text-sm flex items-center gap-3 text-red-600 hover:bg-red-100 hover:text-red-700 hover:font-semibold transition-all"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-600 group-hover:bg-red-100 transition-transform group-hover:-rotate-6">⏻</span>
              <span className="transition-transform group-hover:translate-x-0.5">Logout</span>
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}


