'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage, LANG_NAMES, LANG_CODES, type Language } from '@/contexts/LanguageContext'
import { useWeather } from '@/contexts/WeatherContext'

export default function Navbar() {
    const { language, setLanguage, t } = useLanguage()
    const weather = useWeather()
    const [langOpen, setLangOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [gloveMode, setGloveMode] = useState(false)
    const [highVis, setHighVis] = useState(false)
    const langRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function clickOutside(e: MouseEvent) {
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
        }
        document.addEventListener('mousedown', clickOutside)
        return () => document.removeEventListener('mousedown', clickOutside)
    }, [])

    function toggleGlove() {
        const next = !gloveMode
        setGloveMode(next)
        document.body.classList.toggle('glove-mode', next)
    }
    function toggleHighVis() {
        const next = !highVis
        setHighVis(next)
        document.body.classList.toggle('high-vis', next)
    }

    const weatherStr = weather.loaded && !weather.error
        ? `${weather.icon} ${weather.temp}°F`
        : null

    const navLinks = [
        { href: '/inspect', label: t('nav.inspect') },
        { href: '/parts', label: t('nav.parts') },
        { href: '/fleet', label: t('nav.fleet') },
        { href: '/cab', label: t('nav.cab') },
        { href: '/site', label: 'Site Plan' },
        { href: '/impact', label: t('nav.impact') },
    ]

    return (
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', background: 'rgba(6,8,16,0.90)' }}>

            {/* Announcement bar */}
            <div style={{ background: 'linear-gradient(90deg, #F0A500, #ff8c00)', padding: '6px 24px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <span>🏆 HackIllinois 2026 · Caterpillar Track · Vote FieldMind on Devpost!</span>
                <a href="https://devpost.com" target="_blank" style={{ background: '#000', color: '#F0A500', padding: '2px 10px', borderRadius: 20, fontSize: 11, textDecoration: 'none', fontWeight: 800 }}>Vote →</a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 64, maxWidth: 1400, margin: '0 auto' }}>

                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="bebas" style={{ fontSize: 28, letterSpacing: 2 }}>
                        <span style={{ color: '#fff' }}>FIELD</span>
                        <span style={{ color: '#F0A500' }}>MIND</span>
                    </span>
                    <span style={{ fontSize: 10, color: '#F0A500', border: '1px solid rgba(240,165,0,0.4)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>BETA</span>
                </Link>

                {/* Desktop nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
                    {navLinks.map(l => (
                        <Link key={l.href} href={l.href} style={{ color: 'var(--muted)', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}>
                            {l.label}
                        </Link>
                    ))}
                </div>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                    {/* Weather widget */}
                    {weatherStr && (
                        <Link href="/weather" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', textDecoration: 'none', color: weather.isFreezingCold ? '#60a5fa' : weather.isVeryHot ? '#f87171' : 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
                            {weatherStr}
                        </Link>
                    )}

                    {/* Field mode toggles */}
                    <button onClick={toggleGlove} title="Glove Mode" style={{ padding: '6px 10px', borderRadius: 8, background: gloveMode ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${gloveMode ? 'rgba(240,165,0,0.4)' : 'var(--border)'}`, color: gloveMode ? '#F0A500' : 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>🧤</button>
                    <button onClick={toggleHighVis} title="High Visibility Mode" style={{ padding: '6px 10px', borderRadius: 8, background: highVis ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${highVis ? 'rgba(240,165,0,0.4)' : 'var(--border)'}`, color: highVis ? '#F0A500' : 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>☀️</button>

                    {/* Language picker */}
                    <div ref={langRef} style={{ position: 'relative' }}>
                        <button onClick={() => setLangOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            🌐 {LANG_CODES[language]} ▾
                        </button>
                        {langOpen && (
                            <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, minWidth: 160, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 100 }}>
                                {(Object.keys(LANG_NAMES) as Language[]).map(l => (
                                    <button key={l} onClick={() => { setLanguage(l); setLangOpen(false) }}
                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: l === language ? 'rgba(240,165,0,0.12)' : 'transparent', color: l === language ? '#F0A500' : 'var(--text)', cursor: 'pointer', fontSize: 14, fontWeight: l === language ? 600 : 400 }}>
                                        {LANG_NAMES[l]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Start Inspection CTA */}
                    <Link href="/inspect" className="btn-brand" style={{ padding: '10px 20px', fontSize: 14, textDecoration: 'none', borderRadius: 10, display: 'inline-block' }}>
                        {t('nav.start')} →
                    </Link>
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
        </nav>
    )
}
