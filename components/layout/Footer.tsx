'use client'
import Link from 'next/link'

export default function Footer() {
    return (
        <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '48px 24px 32px', marginTop: 'auto' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
                    <div>
                        <div className="bebas" style={{ fontSize: 24, marginBottom: 8 }}>
                            <span style={{ color: '#fff' }}>FIELD</span>
                            <span style={{ color: 'var(--brand)' }}>MIND</span>
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>The AI Brain for Field Operations. Built for HackIllinois 2026 · Caterpillar Track.</p>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Inspect</div>
                        {[['Quick Check', '/inspect'], ['Full Inspection', '/inspect'], ['Parts ID', '/parts'], ['Cab Mode', '/cab']].map(([l, h]) => (
                            <Link key={h + l} href={h} style={{ display: 'block', color: 'var(--muted)', textDecoration: 'none', fontSize: 14, marginBottom: 6 }}>{l}</Link>
                        ))}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Platform</div>
                        {[['Fleet Dashboard', '/fleet'], ['Weather Advisory', '/weather'], ['Shift Handoff', '/handoff'], ['Social Impact', '/impact']].map(([l, h]) => (
                            <Link key={h + l} href={h} style={{ display: 'block', color: 'var(--muted)', textDecoration: 'none', fontSize: 14, marginBottom: 6 }}>{l}</Link>
                        ))}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Agent Stack</div>
                        {['🔍 Inspector Agent', '🔩 Parts Agent', '🛡️ Safety Agent', '📋 Advisor Agent', '🧠 Memory Agent'].map(a => (
                            <div key={a} style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 6 }}>{a}</div>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>© 2026 FieldMind · fieldmind.tech · Built for HackIllinois 2026</span>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>⛓️ Solana Verified · 🌍 5 Languages</span>
                        <Link href="/easter-egg" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textDecoration: 'none' }}>Inspect this app →</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
