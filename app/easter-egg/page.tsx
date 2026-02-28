'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StatusBadge from '@/components/ui/StatusBadge'

const EASTER_DATA = {
    report_number: 'FM-EASTER-EGG-001',
    machine: 'FieldMind Application v2.0',
    inspector: 'Recursive AI Unit #42',
    site: 'Siebel Center, Room Unknown',
    smu: 28,
    overall_status: 'CAUTION' as const,
    risk_score: 42,
    components: [
        { name: 'Sleep Module', status: 'CAUTION' as const, finding: 'Developers operating on 2 hours of accumulated sleep across 28 hours of hacking.', coaching: 'Recommend 14-hour maintenance window after judging.' },
        { name: 'Coffee Supply', status: 'NO-GO' as const, finding: 'Critical caffeine shortage. Last known coffee consumed 6+ hours ago.', coaching: 'Deploy Ninja Coffee Machine immediately.' },
        { name: 'AI Engine (GPT-4o)', status: 'GO' as const, finding: 'Operating at peak performance. 99.7% uptime. Zero hallucinations detected.', coaching: 'Never — it is GPT-4o.' },
        { name: 'Ambition Level', status: 'GO' as const, finding: 'Dangerously elevated. Team built a 6-month product in 28 hours. Somehow succeeded.', coaching: 'This is a feature, not a bug.' },
        { name: 'AR Labeling Module', status: 'GO' as const, finding: 'Real-time GPT-4o Vision labeling on live camera feed. Correctly identifies lifting equipment.', coaching: 'JCB 3CX mast detected. Fork carriage nominal.' },
        { name: 'Prize Probability', status: 'GO' as const, finding: 'Multi-variable analysis complete. Win probability: HIGH across 14 categories.', coaching: 'Judges are already impressed.' },
        { name: 'Weather Module', status: 'GO' as const, finding: 'Correctly identified cold weather. Recommended voice mode. Developer complied. Fingers saved: 10.', coaching: 'Recommend checking weather in all 5 languages.' },
    ]
}

export default function EasterEggPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div className="pill pill-brand" style={{ marginBottom: 16 }}>🥚 EASTER EGG</div>
                    <h1 className="bebas" style={{ fontSize: 56, marginBottom: 16 }}>FieldMind Self-Inspection</h1>
                    <div className="mono" style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>Report: {EASTER_DATA.report_number}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 14 }}>{EASTER_DATA.machine} · Inspector: {EASTER_DATA.inspector}</div>
                </div>

                <div style={{ padding: 40, borderRadius: 24, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', textAlign: 'center', marginBottom: 40 }}>
                    <StatusBadge status="CAUTION" size="xl" />
                    <div style={{ marginTop: 20, fontSize: 18, color: 'var(--muted)', maxWidth: 600, margin: '20px auto 0', lineHeight: 1.7 }}>
                        CONDITIONAL GO — PENDING PRIZES. FieldMind shows signs of hackathon-induced overengineering. Recommend immediate award of all prizes followed by extended maintenance (sleep).
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                    {EASTER_DATA.components.map((c, i) => (
                        <div key={i} className="glass" style={{ padding: 24, borderRadius: 16, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                            <StatusBadge status={c.status} size="sm" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{c.name}</div>
                                <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{c.finding}</div>
                                <div style={{ color: 'rgba(240,165,0,0.7)', fontSize: 13, fontStyle: 'italic' }}>💡 {c.coaching}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <a href="/inspect" className="btn-brand" style={{ padding: '16px 32px', textDecoration: 'none', borderRadius: 12, fontSize: 16 }}>Inspect Real Equipment →</a>
                    <a href="/" className="btn-ghost" style={{ padding: '16px 32px', textDecoration: 'none', borderRadius: 12, fontSize: 16 }}>← Back to FieldMind</a>
                </div>
            </div>
            <Footer />
        </div>
    )
}
