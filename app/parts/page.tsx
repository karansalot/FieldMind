'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PhotoCapture from '@/components/inspection/PhotoCapture'
import { useLanguage } from '@/contexts/LanguageContext'
import { workerUrl } from '@/lib/utils'

export default function PartsPage() {
    const { t } = useLanguage()
    const [tab, setTab] = useState<'photo' | 'text'>('photo')
    const [photo, setPhoto] = useState<string | null>(null)
    const [description, setDescription] = useState('')
    const [machineModel, setMachineModel] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any[]>([])

    async function identify() {
        setLoading(true)
        try {
            const res = await fetch(workerUrl('/api/parts/identify'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_base64: photo, description, machine_model: machineModel })
            })
            const data = await res.json()
            setResults(data.parts || [])
        } finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div style={{ marginBottom: 48 }}>
                    <div className="pill pill-brand" style={{ marginBottom: 16 }}>🔩 PARTS AGENT</div>
                    <h1 className="bebas" style={{ fontSize: 'clamp(36px, 6vw, 64px)', marginBottom: 16 }}>{t('parts.title')}</h1>
                    <p style={{ color: 'var(--muted)', fontSize: 18 }}>{t('parts.sub')}</p>
                </div>

                <div className="glass" style={{ padding: 32, borderRadius: 20, marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                        {[['photo', '📷 Photo'], ['text', '✏️ Text']].map(([id, label]) => (
                            <button key={id} onClick={() => setTab(id as any)}
                                style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${tab === id ? '#F0A500' : 'var(--border)'}`, background: tab === id ? 'rgba(240,165,0,0.12)' : 'transparent', color: tab === id ? '#F0A500' : 'var(--muted)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'photo' && <PhotoCapture onCapture={setPhoto} label="Take part photo" />}
                    {tab === 'text' && (
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={`${t('parts.describe')} — e.g. "round metal filter, orange, 4 inches diameter"`}
                            style={{ width: '100%', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: '#fff', fontSize: 15, resize: 'vertical', minHeight: 100 }} />
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <input value={machineModel} onChange={e => setMachineModel(e.target.value)} placeholder="Machine model (e.g. CAT 336, JCB 3CX)"
                            style={{ flex: 1, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: '#fff', fontSize: 14 }} />
                        <button onClick={identify} disabled={!photo && !description || loading} className="btn-brand"
                            style={{ padding: '12px 28px', fontSize: 15, opacity: (!photo && !description) || loading ? 0.6 : 1, cursor: (!photo && !description) || loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? 'Identifying...' : t('parts.search')}
                        </button>
                    </div>
                </div>

                {results.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {results.map((r, i) => (
                            <div key={i} className="glass glow-hover" style={{ padding: 28, borderRadius: 20, borderLeft: i === 0 ? '3px solid #F0A500' : '1px solid var(--border)' }}>
                                {i === 0 && <div className="pill pill-brand" style={{ marginBottom: 16, fontSize: 11 }}>✨ {t('parts.best_match')}</div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: '#F0A500', marginBottom: 6 }}>{r.part_number}</div>
                                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{r.part_name}</div>
                                        <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>{r.category}</div>
                                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('parts.fits')}: {r.fits_models?.join(', ')}</div>
                                        {r.why && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>{r.why}</div>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{r.price_estimate}</div>
                                        <div style={{ color: '#F0A500', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{r.confidence}% {t('parts.confidence')}</div>
                                        <a href={r.order_url} target="_blank" className="btn-brand" style={{ padding: '10px 20px', textDecoration: 'none', borderRadius: 10, display: 'inline-block', fontSize: 14 }}>
                                            {t('parts.order')} →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
