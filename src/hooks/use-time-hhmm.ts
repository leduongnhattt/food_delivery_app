"use client"

import { useCallback, useState } from 'react'

export function useTimeHhmm(initial: string = '00:00') {
    const initBuf = (initial || '00:00').replace(/\D/g, '').padEnd(4, '0').slice(0, 4)
    const [buf, setBuf] = useState<string>(initBuf)

    const formatBuf = useCallback((b: string) => `${b.slice(0, 2)}:${b.slice(2, 4)}`, [])

    const apply = useCallback((next: string) => {
        setBuf(next.padStart(4, '0').slice(0, 4))
    }, [])

    const handleDigit = useCallback((digitChar: string) => {
        if (!/^[0-9]$/.test(digitChar)) return
        // Shift-left input so typing fills HH first: 1 -> 10:00, 12 -> 12:00, 123 -> 12:30, 1234 -> 12:34
        const next = (buf.slice(1) + digitChar).slice(0, 4)
        apply(next)
    }, [buf, apply])

    const handleBackspace = useCallback(() => {
        // Shift-right on backspace to undo last typed digit.
        const next = ('0' + buf.slice(0, 3)).slice(0, 4)
        apply(next)
    }, [buf, apply])

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.key
        if (key === 'Tab' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') return
        if (key === 'Backspace' || key === 'Delete') {
            e.preventDefault()
            handleBackspace()
            return
        }
        if (/^[0-9]$/.test(key)) {
            e.preventDefault()
            handleDigit(key)
            return
        }
        if (key.length === 1) e.preventDefault()
    }, [handleBackspace, handleDigit])

    const onPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '')
        let next = buf
        for (const ch of digits) {
            if (!/[0-9]/.test(ch)) continue
            next = (next.slice(1) + ch).slice(0, 4)
        }
        apply(next)
    }, [buf, apply])

    const setFromString = useCallback((hhmm: string) => {
        const d = (hhmm || '').replace(/\D/g, '').padEnd(4, '0').slice(0, 4)
        setBuf(d)
    }, [])

    return {
        value: formatBuf(buf),
        buf,
        setFromString,
        onKeyDown,
        onPaste,
    }
}






