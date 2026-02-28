'use client'
import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const LANG_CODES: Record<string, string> = {
    en: 'en-US', es: 'es-MX', pt: 'pt-BR', fr: 'fr-FR', zh: 'zh-CN'
}

export function useVoice() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [continuous, setContinuous] = useState(false)
    const recognitionRef = useRef<any>(null)
    const { language } = useLanguage()

    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) { alert('Voice not supported in this browser'); return }

        const recognition = new SpeechRecognition()
        recognition.lang = LANG_CODES[language] || 'en-US'
        recognition.continuous = continuous
        recognition.interimResults = true

        recognition.onstart = () => setIsListening(true)
        recognition.onresult = (e: any) => {
            const t = Array.from(e.results).map((r: any) => r[0].transcript).join('')
            setTranscript(t)
        }
        recognition.onend = () => { setIsListening(false); recognitionRef.current = null }
        recognition.onerror = () => { setIsListening(false); recognitionRef.current = null }

        recognitionRef.current = recognition
        recognition.start()
    }, [language, continuous])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        setIsListening(false)
    }, [])

    const toggleContinuous = useCallback(() => setContinuous(c => !c), [])

    const clearTranscript = useCallback(() => setTranscript(''), [])

    return { isListening, transcript, startListening, stopListening, continuous, toggleContinuous, clearTranscript }
}
