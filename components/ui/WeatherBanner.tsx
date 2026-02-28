'use client'
import { useState } from 'react'
import { useWeather } from '@/contexts/WeatherContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function WeatherBanner() {
    const weather = useWeather()
    const { t } = useLanguage()
    const [dismissed, setDismissed] = useState<string[]>([])

    if (!weather.loaded || weather.error) return null

    const banners: Array<{ id: string; condition: boolean; color: string; bg: string; title: string; body: string; cta?: string; icon: string }> = [
        {
            id: 'cold',
            condition: weather.isFreezingCold,
            color: '#60a5fa',
            bg: 'rgba(96,165,250,0.08)',
            icon: '❄️',
            title: t('weather.cold_title'),
            body: t('weather.cold_body'),
            cta: t('weather.cold_cta'),
        },
        {
            id: 'hot',
            condition: weather.isVeryHot,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
            icon: '☀️',
            title: t('weather.hot_title'),
            body: t('weather.hot_body'),
        },
        {
            id: 'rain',
            condition: weather.isRainy || weather.isSnowy,
            color: '#64748b',
            bg: 'rgba(100,116,139,0.1)',
            icon: weather.isSnowy ? '❄️' : '🌧️',
            title: t('weather.rain_title'),
            body: t('weather.rain_body'),
        },
        {
            id: 'wind',
            condition: weather.isWindy,
            color: '#a78bfa',
            bg: 'rgba(167,139,250,0.08)',
            icon: '💨',
            title: t('weather.wind_title'),
            body: t('weather.wind_body'),
        },
    ]

    const activeBanners = banners.filter(b => b.condition && !dismissed.includes(b.id))
    if (!activeBanners.length) return null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeBanners.map(b => (
                <div key={b.id} style={{ background: b.bg, border: `1px solid ${b.color}40`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{b.icon}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: b.color, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{b.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{b.body}</div>
                    </div>
                    {b.cta && (
                        <button style={{ background: b.color, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {b.cta}
                        </button>
                    )}
                    <button onClick={() => setDismissed(d => [...d, b.id])} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
            ))}
        </div>
    )
}
