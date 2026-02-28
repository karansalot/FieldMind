'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useWeather } from '@/contexts/WeatherContext'

const DEMO_INSPECTIONS = [
    { machine: 'CAT 336', serial: 'SJD00847', status: 'NO-GO', issue: 'Hydraulic hose rupture + oil level critical', part: '326-1643 Hydraulic Return Filter' },
    { machine: 'JCB 3CX', serial: 'JCB88421', status: 'CAUTION', issue: 'Track tension at wear limit, air filter overdue', part: '175-2949 Air Filter' },
    { machine: 'CAT 950', serial: 'FWR01234', status: 'CAUTION', issue: 'Battery showing reduced capacity', part: 'Battery test required' },
    { machine: 'CAT D6', serial: 'GXN00521', status: 'GO', issue: 'All systems nominal', part: null },
    { machine: 'JCB 540-140', serial: 'TH994122', status: 'GO', issue: 'Telehandler at full operation spec', part: null },
]

const STATUS_COLORS: Record<string, string> = { GO: '#22c55e', CAUTION: '#f59e0b', 'NO-GO': '#ef4444' }

export default function HandoffPage() {
    const weather = useWeather()
    const [generated, setGenerated] = useState(false)
    const [loading, setLoading] = useState(false)

    const nogoMachines = DEMO_INSPECTIONS.filter(i => i.status === 'NO-GO')
    const cautionMachines = DEMO_INSPECTIONS.filter(i => i.status === 'CAUTION')
    const goMachines = DEMO_INSPECTIONS.filter(i => i.status === 'GO')

    async function generate() {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1200))
        setGenerated(true)
        setLoading(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div className="pill pill-brand" style={{ marginBottom: 16 }}>SHIFT HANDOFF</div>
                <h1 className="bebas" style={{ fontSize: 'clamp(36px, 6vw, 56px)', marginBottom: 8 }}>AI-GENERATED SHIFT HANDOFF</h1>
                <p style={{ color: 'var(--muted)', marginBottom: 40 }}>FieldMind reads today's inspections and generates the handoff automatically. No paperwork.</p>

                {!generated ? (
                    <button onClick={generate} disabled={loading} className="btn-brand" style={{ padding: '18px 48px', fontSize: 18, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? '⏳ Generating from today\'s inspections...' : '📋 Generate Shift Handoff'}
                    </button>
                ) : (
                    <div className="animate-fade-in">
                        <div className="glass" style={{ padding: 40, borderRadius: 20, marginBottom: 32, fontFamily: 'DM Mono, monospace' }}>
                            <div style={{ color: '#F0A500', fontWeight: 700, marginBottom: 24, fontSize: 14 }}>
                                SHIFT HANDOFF — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — FieldMind Auto-Generated
                            </div>

                            <div style={{ marginBottom: 28 }}>
                                <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 12, fontSize: 13 }}>🛑 MACHINES DOWN — DO NOT START:</div>
                                {nogoMachines.map(m => (
                                    <div key={m.serial} style={{ paddingLeft: 16, marginBottom: 10, borderLeft: '2px solid #ef4444' }}>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{m.machine} [{m.serial}]</div>
                                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{m.issue}</div>
                                        {m.part && <div style={{ color: '#F0A500', fontSize: 13 }}>Part needed: {m.part}</div>}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: 28 }}>
                                <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 12, fontSize: 13 }}>⚠️ MONITOR CLOSELY:</div>
                                {cautionMachines.map(m => (
                                    <div key={m.serial} style={{ paddingLeft: 16, marginBottom: 10, borderLeft: '2px solid #f59e0b' }}>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{m.machine} [{m.serial}]</div>
                                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{m.issue}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: 28 }}>
                                <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 12, fontSize: 13 }}>✅ ALL CLEAR:</div>
                                {goMachines.map(m => <div key={m.serial} style={{ paddingLeft: 16, color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>{m.machine} [{m.serial}]</div>)}
                            </div>

                            {weather.loaded && (
                                <div>
                                    <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>🌤️ WEATHER NEXT SHIFT:</div>
                                    <div style={{ paddingLeft: 16, color: 'var(--muted)', fontSize: 14 }}>
                                        {weather.temp}°F, {weather.condition}
                                        {weather.isFreezingCold && ' — Cold protocol: Pre-warm hydraulics, test batteries before operation'}
                                        {weather.isVeryHot && ' — Heat protocol: Check coolant levels at start of every shift'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <button className="btn-brand" style={{ padding: '14px 28px', fontSize: 15 }}>📄 Export PDF</button>
                            <button className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>📱 Share via SMS</button>
                            <button className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>🖨️ Print</button>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
