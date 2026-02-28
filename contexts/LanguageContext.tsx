'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'zh'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (k) => k,
})

const LANG_NAMES: Record<Language, string> = {
    en: '🇺🇸 English',
    es: '🇪🇸 Español',
    pt: '🇧🇷 Português',
    fr: '🇫🇷 Français',
    zh: '🇨🇳 中文',
}

const LANG_CODES: Record<Language, string> = {
    en: 'EN', es: 'ES', pt: 'PT', fr: 'FR', zh: 'ZH',
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')
    const [messages, setMessages] = useState<Record<string, any>>({})

    useEffect(() => {
        // Auto-detect browser language
        const stored = localStorage.getItem('fieldmind-lang') as Language
        if (stored && ['en', 'es', 'pt', 'fr', 'zh'].includes(stored)) {
            loadLanguage(stored)
            return
        }
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith('es')) loadLanguage('es')
        else if (browserLang.startsWith('pt')) loadLanguage('pt')
        else if (browserLang.startsWith('fr')) loadLanguage('fr')
        else if (browserLang.startsWith('zh')) loadLanguage('zh')
        else loadLanguage('en')
    }, [])

    async function loadLanguage(lang: Language) {
        try {
            const msgs = await import(`../messages/${lang}.json`)
            setMessages(msgs.default)
            setLanguageState(lang)
            localStorage.setItem('fieldmind-lang', lang)
            document.documentElement.lang = lang
        } catch {
            const msgs = await import('../messages/en.json')
            setMessages(msgs.default)
            setLanguageState('en')
        }
    }

    function t(key: string): string {
        const parts = key.split('.')
        let val: any = messages
        for (const p of parts) {
            if (val && typeof val === 'object' && p in val) val = val[p]
            else return key
        }
        return typeof val === 'string' ? val : key
    }

    function setLanguage(lang: Language) {
        loadLanguage(lang)
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    return useContext(LanguageContext)
}

export { LANG_NAMES, LANG_CODES }
