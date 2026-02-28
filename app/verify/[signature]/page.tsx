'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { workerUrl } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'

export default function VerifyPage() {
    const params = useParams()
    const sig = params?.signature as string
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!sig) return
        fetch(workerUrl(`/api/verify/${sig}`)).then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
    }, [sig])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
                {loading ? (
                    <div style={{ color: 'var(--muted)', fontSize: 18 }}>⏳ Verifying on Solana...</div>
                ) : data?.verified ? (
                    <div className="animate-fade-in">
                        <div style={{ fontSize: 80, marginBottom: 24 }}>✅</div>
                        <div className="bebas" style={{ fontSize: 56, color: '#22c55e', marginBottom: 8 }}>VERIFIED</div>
                        <div style={{ color: 'var(--muted)', marginBottom: 40 }}>This inspection is permanently recorded on the Solana blockchain.</div>

                        <div className="glass" style={{ padding: 32, borderRadius: 20, textAlign: 'left', marginBottom: 32 }}>
                            {[['Report', data.report_number], ['Machine', `${data.machine_brand || 'CAT'} ${data.machine_model}`], ['Serial', data.serial_number || 'N/A'], ['Inspector', data.inspector_name || 'N/A'], ['Site', data.site_name || 'N/A'], ['Completed', data.completed_at ? new Date(data.completed_at).toLocaleDateString() : 'N/A']].map(([l, v]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 15 }}>
                                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                                    <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
                                </div>
                            ))}
                            <div style={{ paddingTop: 16 }}>
                                <StatusBadge status={data.overall_status} size="lg" />
                            </div>
                        </div>

                        <div style={{ background: 'rgba(153,69,255,0.08)', border: '1px solid rgba(153,69,255,0.3)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                            <div style={{ color: '#9945FF', fontWeight: 800, marginBottom: 8 }}>⛓️ BLOCKCHAIN RECORD</div>
                            <div className="mono" style={{ color: 'var(--muted)', fontSize: 12, wordBreak: 'break-all', marginBottom: 12 }}>{sig}</div>
                            <a href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" style={{ color: '#9945FF', fontWeight: 700, textDecoration: 'none' }}>View on Solana Explorer →</a>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: 80, marginBottom: 24 }}>❌</div>
                        <div className="bebas" style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}>NOT FOUND</div>
                        <div style={{ color: 'var(--muted)' }}>This signature was not found in FieldMind records.</div>
                    </div>
                )}
            </div>
        </div>
    )
}
