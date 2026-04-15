"use client"

import { useEffect, useRef, useState } from "react"

const DEBOUNCE_MS = 350

/**
 * Search input synced to URL: updates after a short debounce while typing (no Enter required).
 */
export function useAdminSearchInput(
  searchFromUrl: string,
  onApply: (trimmed: string) => void,
) {
  const [value, setValue] = useState(searchFromUrl)
  const onApplyRef = useRef(onApply)
  onApplyRef.current = onApply
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(searchFromUrl)
  }, [searchFromUrl])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValue(v)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onApplyRef.current(v.trim())
    }, DEBOUNCE_MS)
  }

  return { value, onChange }
}
