'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWeather } from '@/contexts/WeatherContext'
import { workerUrl } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'

export default function FleetPage() {
    const { t } = useLanguage()
    const weather = useWeather()
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(workerUrl('/api/fleet/analytics')).then(r => r.json()).then(d => { setAnalytics(d); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    const mockFleet = [
        { id: '1', brand: 'CAT', model: '336', serial: 'SJD00847', type: 'Excavator', health: 23, status: 'NO-GO', smu: 4221, site: 'Site Alpha', last: '2h ago' },
        { id: '2', brand: 'CAT', model: '950', serial: 'FWR01234', type: 'Wheel Loader', health: 67, status: 'CAUTION', smu: 1847, site: 'Site Beta', last: '4h ago' },
        { id: '3', brand: 'CAT', model: 'D6', serial: 'GXN00521', type: 'Bulldozer', health: 94, status: 'GO', smu: 892, site: 'Site Alpha', last: '8h ago' },
        { id: '4', brand: 'JCB', model: '3CX', serial: 'JCB88421', type: 'Backhoe', health: 78, status: 'CAUTION', smu: 2100, site: 'Site Gamma', last: '1d ago' },
        { id: '5', brand: 'JCB', model: '540-140', serial: 'TH994122', type: 'Telehandler', health: 91, status: 'GO', smu: 650, site: 'Site Beta', last: '6h ago' },
        { id: '6', brand: 'CAT', model: '320', serial: 'MJD00123', type: 'Excavator', health: 12, status: 'NO-GO', smu: 2847, site: 'Site Delta', last: '30m ago' },
    ]

    const fleetHealth = Math.round(mockFleet.reduce((a, m) => a + m.health, 0) / mockFleet.length)

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div style={{ marginBottom: 40 }}>
                    <div className="pill pill-brand" style={{ marginBottom: 16 }}>FLEET DASHBOARD</div>
                    <h1 className="bebas" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: 8 }}>{t('fleet.title')}</h1>
                </div>

                {/* Weather fleet advisory */}
                {weather.loaded && (weather.isFreezingCold || weather.isVeryHot) && (
                    <div style={{ background: weather.isFreezingCold ? 'rgba(96,165,250,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${weather.isFreezingCold ? 'rgba(96,165,250,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 16, padding: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: weather.isFreezingCold ? '#60a5fa' : '#f87171' }}>
                                {weather.isFreezingCold ? '❄️ Pre-Freeze Fleet Check Recommended' : '☀️ Heat Advisory — Fleet Check Recommended'}
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                                {weather.isFreezingCold
                                    ? 'Check all hydraulic seals · Test batteries (cold reduces capacity 40%) · Verify coolant mix · Drain water from air systems'
                                    : 'Coolant systems critical · Monitor hydraulic temps · Increase fluid check frequency'}
                            </div>
                        </div>
                        <a href="/inspect" className="btn-brand" style={{ padding: '12px 24px', textDecoration: 'none', borderRadius: 10, fontSize: 14, display: 'block', whiteSpace: 'nowrap' }}>
                            {weather.isFreezingCold ? '❄️ Run Fleet Pre-Freeze Check' : '☀️ Run Heat Check'}
                        </a>
                    </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
                    {[
                        { label: 'Fleet Health', value: `${fleetHealth}%`, color: fleetHealth > 70 ? '#22c55e' : fleetHealth > 40 ? '#f59e0b' : '#ef4444' },
                        { label: 'Machines', value: mockFleet.length, color: '#F0A500' },
                        { label: 'NO-GO Units', value: mockFleet.filter(m => m.status === 'NO-GO').length, color: '#ef4444' },
                        { label: 'CAUTION Units', value: mockFleet.filter(m => m.status === 'CAUTION').length, color: '#f59e0b' },
                        { label: 'Clear', value: mockFleet.filter(m => m.status === 'GO').length, color: '#22c55e' },
                    ].map((s, i) => (
                        <div key={i} className="glass" style={{ padding: '24px 20px', borderRadius: 16, textAlign: 'center' }}>
                            <div className="bebas" style={{ fontSize: 40, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Machine grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                    {mockFleet.map(m => (
                        <div key={m.id} className={`glass status-card-${m.status.replace('-', '').toLowerCase() === 'nogo' ? 'nogo' : m.status.toLowerCase()}`}
                            style={{ padding: 24, borderRadius: 18, border: '1px solid' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 18 }}>{m.brand} {m.model}</div>
                                    <div className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>{m.serial} · {m.type}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{m.site} · {m.smu.toLocaleString()} SMU</div>
                                </div>
                                <StatusBadge status={m.status as any} size="sm" />
                            </div>

                            {/* Health bar */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                                    <span>{t('fleet.health')}</span><span style={{ color: m.health > 70 ? '#22c55e' : m.health > 40 ? '#f59e0b' : '#ef4444' }}>{m.health}%</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                                    <div style={{ height: '100%', width: `${m.health}%`, background: m.health > 70 ? '#22c55e' : m.health > 40 ? '#f59e0b' : '#ef4444', borderRadius: 3, transition: 'width 0.5s' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Last: {m.last}</span>
                                <a href="/inspect" className="btn-brand" style={{ padding: '8px 16px', textDecoration: 'none', borderRadius: 8, fontSize: 13, display: 'inline-block' }}>{t('fleet.inspect_now')}</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    )
}
