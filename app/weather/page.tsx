'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useWeather } from '@/contexts/WeatherContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function WeatherPage() {
    const weather = useWeather()
    const { t } = useLanguage()

    const impacts = [
        { condition: weather.isFreezingCold, icon: '❄️', title: 'Cold Impact', color: '#60a5fa', items: ['Hydraulic seals: HIGH RISK — inspect all connections', 'Battery performance: -40% capacity — test all units', 'Diesel fuel: Check for gelling risk below 0°F', 'Tire/track pressure drops 1 PSI per 10°F drop'] },
        { condition: weather.isVeryHot, icon: '☀️', title: 'Heat Impact', color: '#f59e0b', items: ['Coolant system: CRITICAL — check concentration and level', 'Hydraulic fluid overheating risk above 95°F', 'Increased wear rate on all friction components', 'Battery fluid evaporation — check levels more frequently'] },
        { condition: weather.isRainy || weather.isSnowy, icon: '🌧️', title: 'Wet Conditions', color: '#818cf8', items: ['Electrical connections require extra attention', 'Slip hazards on steps, platforms, and ladders', 'Rust acceleration on exposed metal surfaces', 'Visibility may affect safe operation'] },
        { condition: weather.isWindy, icon: '💨', title: 'High Wind Impact', color: '#94a3b8', items: ['JCB/CAT telehandler: Check manufacturer wind speed limits', 'Secure all loose attachments before operation', 'Boom and lifting operations: extra caution required', 'Stability reduced on grades above 10°'] },
    ]
    const activeImpacts = impacts.filter(i => i.condition)

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div className="pill pill-brand" style={{ marginBottom: 16 }}>🌤️ WEATHER ADVISORY</div>
                <h1 className="bebas" style={{ fontSize: 'clamp(36px, 6vw, 64px)', marginBottom: 40 }}>WEATHER IMPACT ON YOUR FLEET</h1>

                {/* Big current conditions */}
                {weather.loaded ? (
                    <div className="glass" style={{ padding: 40, borderRadius: 24, marginBottom: 40, textAlign: 'center' }}>
                        <div style={{ fontSize: 72, marginBottom: 16 }}>{weather.icon}</div>
                        <div className="bebas" style={{ fontSize: 72, lineHeight: 1, color: weather.isFreezingCold ? '#60a5fa' : weather.isVeryHot ? '#f87171' : '#F0A500' }}>
                            {weather.temp}°F
                        </div>
                        <div style={{ fontSize: 20, color: 'var(--muted)', marginBottom: 8 }}>{weather.tempC}°C · {weather.condition}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 15 }}>{weather.city} · Wind {weather.windSpeed}mph · Humidity {weather.humidity}%</div>
                    </div>
                ) : (
                    <div className="glass" style={{ padding: 40, borderRadius: 24, marginBottom: 40, textAlign: 'center', color: 'var(--muted)' }}>Detecting your location...</div>
                )}

                {/* Active impacts */}
                {activeImpacts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
                        {activeImpacts.map((imp, i) => (
                            <div key={i} style={{ background: `${imp.color}10`, border: `1px solid ${imp.color}40`, borderRadius: 16, padding: 28 }}>
                                <div style={{ color: imp.color, fontWeight: 800, fontSize: 18, marginBottom: 16 }}>{imp.icon} {imp.title}</div>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {imp.items.map((item, j) => (
                                        <li key={j} style={{ color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                            <span style={{ color: imp.color, flexShrink: 0 }}>•</span>{item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : weather.loaded && (
                    <div className="glass" style={{ padding: 32, borderRadius: 16, textAlign: 'center', marginBottom: 40, color: '#22c55e' }}>
                        ✅ Normal conditions — No special weather protocols required today.
                    </div>
                )}

                <Link href="/inspect" className="btn-brand" style={{ padding: '18px 40px', fontSize: 18, textDecoration: 'none', borderRadius: 14, display: 'inline-block' }}>
                    {weather.isFreezingCold ? '❄️ Start Cold Weather Inspection →' : '🔍 Start Inspection →'}
                </Link>
            </div>
            <Footer />
        </div>
    )
}
