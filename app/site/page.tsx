'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PhotoCapture from '@/components/inspection/PhotoCapture'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SitePlannerPage() {
    const { t } = useLanguage()
    const [photo, setPhoto] = useState<string | null>(null)
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [plan, setPlan] = useState<any>(null)

    async function generatePlan() {
        setLoading(true)
        try {
            // Direct call to OpenAI for the hackathon demo
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `You are the FieldMind Site Logistics AI. Your goal is to optimize safety, efficiency, and cost for a construction/industrial site.
Return ONLY valid JSON matching this structure:
{
  "safety_score": 85,
  "efficiency_score": 92,
  "zones": [
    { "name": "Heavy Equipment Parking", "rationale": "Keeps JCB/CAT machinery away from foot traffic to minimize risky interactions." },
    { "name": "Material Staging", "rationale": "Placed near site entrance to reduce congestion and travel distance." }
  ],
  "hazards_mitigated": ["Blind spots near trench", "Pedestrian crossing risk"],
  "cost_optimization": "Reduced fuel burn by staging dozers closer to the active cut zone.",
  "layout_recommendation": "A short paragraph describing the optimal layout."
}`
                        },
                        {
                            role: 'user',
                            content: photo
                                ? [
                                    { type: 'text', text: `Generate layout/logistics plan for this site. Additional context: ${description}` },
                                    { type: 'image_url', image_url: { url: photo } }
                                ]
                                : [
                                    { type: 'text', text: `Generate layout/logistics plan for this site description: ${description}` }
                                ]
                        }
                    ],
                    response_format: { type: 'json_object' }
                })
            })
            const data = await res.json()
            setPlan(JSON.parse(data.choices[0].message.content))
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 24px 80px' }}>
                <div style={{ marginBottom: 48 }}>
                    <div className="pill pill-brand" style={{ marginBottom: 16 }}>🗺️ SITE PLANNER AGENT</div>
                    <h1 className="bebas" style={{ fontSize: 'clamp(36px, 6vw, 64px)', marginBottom: 16 }}>AI SITE LOGISTICS & LAYOUT</h1>
                    <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 650, lineHeight: 1.6 }}>
                        Optimize safety, efficiency, and cost. Automatically generate multiple layout and logistics plans to minimize risky interactions, reduce travel, and cut operational overhead.
                    </p>
                </div>

                {!plan ? (
                    <div className="glass" style={{ padding: 32, borderRadius: 20 }}>
                        <div style={{ marginBottom: 24 }}>
                            <PhotoCapture onCapture={setPhoto} label="Upload Site Map or Aerial Photo (Optional)" />
                        </div>

                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--muted)', fontWeight: 600 }}>Site Constraints & Equipment</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="E.g., 5 acre site, 2 CAT 336 Excavators, 1 JCB Telehandler, steep grade on north side..."
                            style={{ width: '100%', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: '#fff', fontSize: 15, resize: 'vertical', minHeight: 120, marginBottom: 24 }}
                        />

                        <button onClick={generatePlan} disabled={loading || (!photo && !description)} className="btn-brand" style={{ width: '100%', padding: '16px', fontSize: 18, opacity: (loading || (!photo && !description)) ? 0.7 : 1 }}>
                            {loading ? '⏳ Generating Logistics Plan...' : '🗺️ Generate Optimized Layout'}
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                            <button className="btn-ghost" onClick={() => setPlan(null)}>← Start Over</button>
                        </div>

                        {/* Score Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                            <div className="glass" style={{ padding: 32, borderRadius: 20, textAlign: 'center', borderTop: '3px solid #22c55e' }}>
                                <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>SAFETY SCORE</div>
                                <div className="bebas" style={{ fontSize: 64, color: '#22c55e', lineHeight: 1 }}>{plan.safety_score}/100</div>
                            </div>
                            <div className="glass" style={{ padding: 32, borderRadius: 20, textAlign: 'center', borderTop: '3px solid #F0A500' }}>
                                <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>EFFICIENCY SCORE</div>
                                <div className="bebas" style={{ fontSize: 64, color: '#F0A500', lineHeight: 1 }}>{plan.efficiency_score}/100</div>
                            </div>
                        </div>

                        {/* AI Recommendation */}
                        <div className="glass" style={{ padding: 32, borderRadius: 20, marginBottom: 32, borderLeft: '4px solid #F0A500' }}>
                            <h3 className="bebas" style={{ fontSize: 28, marginBottom: 12 }}>Executive Summary</h3>
                            <p style={{ color: '#fff', fontSize: 16, lineHeight: 1.7 }}>{plan.layout_recommendation}</p>
                        </div>

                        {/* Zones Grid */}
                        <h3 className="bebas" style={{ fontSize: 32, marginBottom: 16 }}>Optimized Zones</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
                            {plan.zones.map((z: any, i: number) => (
                                <div key={i} style={{ padding: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 16 }}>
                                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: '#F0A500' }}>📍 {z.name}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{z.rationale}</div>
                                </div>
                            ))}
                        </div>

                        {/* Hazards & Costs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
                                <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>🛑</span> Hazards Mitigated
                                </div>
                                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', lineHeight: 1.6 }}>
                                    {plan.hazards_mitigated.map((h: string, i: number) => <li key={i} style={{ marginBottom: 8 }}>{h}</li>)}
                                </ul>
                            </div>

                            <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
                                <div style={{ fontWeight: 800, color: '#22c55e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>💰</span> Cost & Overhead Optimization
                                </div>
                                <div style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                                    {plan.cost_optimization}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
