'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

const STATS = [
    { value: '1,247', label: 'injuries/day', color: '#ef4444', context: 'construction injuries every single day' },
    { value: '36%', label: 'equipment related', color: '#f59e0b', context: 'caused by equipment failure or misuse' },
    { value: '73%', label: 'preventable', color: '#22c55e', context: 'preventable with proper inspection' },
    { value: '$171B', label: 'annual cost', color: '#F0A500', context: 'annual cost of construction incidents' },
]

export default function ImpactPage() {
    const { t } = useLanguage()
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 72 }}>
                    <div className="pill pill-brand" style={{ marginBottom: 16 }}>SOCIAL IMPACT</div>
                    <h1 className="bebas" style={{ fontSize: 'clamp(40px, 7vw, 80px)', marginBottom: 24, lineHeight: 0.95 }}>{t('impact.title')}</h1>
                    <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                        Construction is the most dangerous industry. FieldMind makes every inspector as capable as the best inspector.
                    </p>
                </div>

                {/* Counter stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 80 }}>
                    {STATS.map((s, i) => (
                        <div key={i} className="glass" style={{ padding: 40, borderRadius: 20, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                            <div className="bebas" style={{ fontSize: 56, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 8 }}>{s.label}</div>
                            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{s.context}</div>
                        </div>
                    ))}
                </div>

                {/* Language equity */}
                <div style={{ background: 'linear-gradient(135deg, rgba(240,165,0,0.08), rgba(153,69,255,0.08))', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 20, padding: 40, marginBottom: 48 }}>
                    <h2 className="bebas" style={{ fontSize: 36, marginBottom: 20, color: '#F0A500' }}>LANGUAGE EQUITY</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                        <div>
                            <div style={{ fontSize: 48, color: '#F0A500', fontWeight: 800, marginBottom: 8 }}>35%</div>
                            <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>of construction workers speak Spanish</div>
                            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>Zero major inspection tools supported Spanish before FieldMind. We built the first AI inspection platform with full Spanish support — not translated, but native.</div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[['🇺🇸 English', 'Full AI + Voice'], ['🇪🇸 Español', 'Full AI + Voice'], ['🇧🇷 Português', 'Full AI + Voice'], ['🇫🇷 Français', 'Full AI + Voice'], ['🇨🇳 中文', 'Full AI + Voice']].map(([lang, support]) => (
                                    <div key={lang} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontWeight: 600 }}>{lang}</span>
                                        <span style={{ color: '#22c55e', fontSize: 13 }}>✅ {support}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* JCB + CAT impact */}
                <div className="glass" style={{ padding: 40, borderRadius: 20 }}>
                    <h2 className="bebas" style={{ fontSize: 36, marginBottom: 16 }}>LIFTING EQUIPMENT SAFETY</h2>
                    <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>Lifting operations (telehandlers, reach stackers, cranes) account for 34% of fatal construction incidents. FieldMind is the first AI inspection tool with dedicated lifting safety checks — covering both CAT and JCB fleets with real-time AR component identification.</p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div className="pill pill-nogo">🏋️ Mast crack detection</div>
                        <div className="pill pill-nogo">⛓️ Load chain inspection</div>
                        <div className="pill pill-caution">📊 SLI verification</div>
                        <div className="pill pill-caution">🔩 Fork wear measurement</div>
                        <div className="pill pill-brand">🤖 Real-time AR labels</div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
