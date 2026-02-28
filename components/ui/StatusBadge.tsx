'use client'
import { useLanguage } from '@/contexts/LanguageContext'
import { STATUS_CONFIG } from '@/lib/cat-knowledge'

type Status = 'GO' | 'CAUTION' | 'NO-GO'

interface Props {
    status: Status | string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    language?: string
}

export default function StatusBadge({ status, size = 'md', language }: Props) {
    const { language: ctxLang } = useLanguage()
    const lang = (language || ctxLang) as keyof typeof STATUS_CONFIG.GO.labels

    const cfg = STATUS_CONFIG[status as Status]
    if (!cfg) return null

    const label = cfg.labels?.[lang] || cfg.label
    const sizeStyles = {
        sm: { fontSize: 12, padding: '3px 10px', borderRadius: 6, iconSize: 14 },
        md: { fontSize: 14, padding: '5px 14px', borderRadius: 8, iconSize: 18 },
        lg: { fontSize: 20, padding: '8px 20px', borderRadius: 10, iconSize: 24 },
        xl: { fontSize: 32, padding: '16px 40px', borderRadius: 16, iconSize: 40 },
    }[size]

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: sizeStyles.fontSize,
            padding: sizeStyles.padding,
            borderRadius: sizeStyles.borderRadius,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
            fontWeight: 800,
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.05em',
        }}>
            <span style={{ fontSize: sizeStyles.iconSize }}>{cfg.icon}</span>
            {label}
        </span>
    )
}
