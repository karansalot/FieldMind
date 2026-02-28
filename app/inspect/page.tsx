'use client'
import { useState, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WeatherBanner from '@/components/ui/WeatherBanner'
import StatusBadge from '@/components/ui/StatusBadge'
import PhotoCapture from '@/components/inspection/PhotoCapture'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWeather } from '@/contexts/WeatherContext'
import { workerUrl, vibrate } from '@/lib/utils'
import { INSPECTION_SECTIONS, QUICK_CHECK_COMPONENTS, CAT_MACHINES } from '@/lib/cat-knowledge'
import dynamic from 'next/dynamic'

const ARLabeling = dynamic(() => import('@/components/inspection/ARLabeling'), { ssr: false })
const RiskGauge = dynamic(() => import('@/components/three/RiskGauge'), { ssr: false })

type Stage = 'mode' | 'machine' | 'walkaround' | 'results'
type Mode = 'quick' | 'full'

const ALL_BRANDS = [
    { brand: 'CAT', types: Object.entries(CAT_MACHINES) },
    {
        brand: 'JCB', types: [
            ['backhoe', { label: 'Backhoe Loader', icon: '🏗️', models: ['3CX', '4CX', '5CX'], label_es: 'Retroexcavadora' }],
            ['telehandler_jcb', { label: 'Telehandler', icon: '🏋️', models: ['509-42', '510-56', '540-140', '560-80'], label_es: 'Manipulador Telescópico' }],
            ['skid_steer_jcb', { label: 'Skid Steer', icon: '🔧', models: ['155', '175', '190T', '205T'], label_es: 'Minicargadora' }],
            ['excavator_jcb', { label: 'Excavator', icon: '⛏️', models: ['85Z-1', '100C', '130', '145', '220', '245'], label_es: 'Excavadora' }],
        ] as [string, any][]
    }
]

const LIFTING_TYPES = ['telehandler', 'telehandler_jcb', 'rt_forklift']

export default function InspectPage() {
    const { t, language } = useLanguage()
    const weather = useWeather()
    const [stage, setStage] = useState<Stage>('mode')
    const [mode, setMode] = useState<Mode>('full')
    const [selectedBrand, setSelectedBrand] = useState('CAT')
    const [selectedType, setSelectedType] = useState('')
    const [selectedModel, setSelectedModel] = useState('')
    const [serial, setSerial] = useState('')
    const [smu, setSmu] = useState('')
    const [site, setSite] = useState('')
    const [inspector, setInspector] = useState('')
    const [inspId, setInspId] = useState('')
    const [sectionIdx, setSectionIdx] = useState(0)
    const [compIdx, setCompIdx] = useState(0)
    const [photo, setPhoto] = useState<string | null>(null)
    const [voiceNote, setVoiceNote] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [components, setComponents] = useState<any[]>([])
    const [result, setResult] = useState<any>(null)
    const [nogoAlert, setNogoAlert] = useState(false)
    const [finalResult, setFinalResult] = useState<any>(null)
    const [arActive, setArActive] = useState(false)
    const [blockchainSig, setBlockchainSig] = useState('')
    const [verifying, setVerifying] = useState(false)

    const sections = mode === 'quick' ? [] : INSPECTION_SECTIONS
    const quickComps = QUICK_CHECK_COMPONENTS
    const currentSection = sections[sectionIdx]
    const currentComp = mode === 'quick'
        ? quickComps[compIdx]
        : { name: currentSection?.components[compIdx] || '', icon: currentSection?.icon }
    const isLifting = LIFTING_TYPES.includes(selectedType)

    const totalItems = mode === 'quick' ? quickComps.length : sections.reduce((a, s) => a + s.components.length, 0)
    const doneItems = components.length

    async function startInspection() {
        const res = await fetch(workerUrl('/api/inspections'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                machine_type: selectedType, machine_brand: selectedBrand,
                machine_model: selectedModel, serial_number: serial,
                site_name: site, inspector_name: inspector,
                smu_hours: parseInt(smu) || 0, language, mode,
                weather_temp: weather.loaded ? weather.temp : null,
                weather_condition: weather.condition
            })
        })
        const data = await res.json()
        setInspId(data.id)
        setStage('walkaround')
    }

    async function analyzeComponent() {
        if (!photo && !voiceNote) return
        setAnalyzing(true)
        try {
            const res = await fetch(workerUrl(`/api/inspections/${inspId}/components`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_name: mode === 'quick' ? currentComp?.name : currentSection?.components[compIdx],
                    section_name: mode === 'quick' ? 'Quick Check' : currentSection?.name,
                    section_order: mode === 'quick' ? 0 : currentSection?.order,
                    image_base64: photo,
                    voice_note: voiceNote,
                    language
                })
            })
            const data = await res.json()
            setResult(data)
            setComponents(prev => [...prev, data])
            if (data.status === 'NO-GO') {
                vibrate([200, 100, 200, 100, 400])
                setNogoAlert(true)
            } else {
                vibrate(data.status === 'GO' ? [50] : [100, 50, 100])
            }
        } finally {
            setAnalyzing(false)
        }
    }

    function nextComponent() {
        setResult(null); setPhoto(null); setVoiceNote(''); setNogoAlert(false)
        if (mode === 'quick') {
            if (compIdx + 1 < quickComps.length) setCompIdx(c => c + 1)
            else finishInspection()
        } else {
            const nextCompIdx = compIdx + 1
            if (nextCompIdx < currentSection.components.length) setCompIdx(nextCompIdx)
            else if (sectionIdx + 1 < sections.length) { setSectionIdx(s => s + 1); setCompIdx(0) }
            else finishInspection()
        }
    }

    function markGo() {
        setComponents(prev => [...prev, { status: 'GO', component_name: currentComp?.name }])
        vibrate([50])
        nextComponent()
    }

    async function finishInspection() {
        const res = await fetch(workerUrl(`/api/inspections/${inspId}/complete`), { method: 'POST' })
        const data = await res.json()
        setFinalResult(data)
        setStage('results')
    }

    async function verifyBlockchain() {
        setVerifying(true)
        try {
            const res = await fetch(workerUrl(`/api/inspections/${inspId}/verify-blockchain`), { method: 'POST' })
            const data = await res.json()
            setBlockchainSig(data.signature)
        } finally { setVerifying(false) }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ paddingTop: 120, minHeight: '100vh', maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>

                {/* MODE SELECT */}
                {stage === 'mode' && (
                    <div className="animate-fade-in">
                        <h1 className="bebas" style={{ fontSize: 48, marginBottom: 8 }}>{t('inspect.title')}</h1>
                        <p style={{ color: 'var(--muted)', marginBottom: 40 }}>Choose your inspection mode</p>
                        <WeatherBanner />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32 }}>
                            {[{ mode: 'quick' as Mode, icon: '⚡', title: t('inspect.quick'), sub: t('inspect.quick_sub') }, { mode: 'full' as Mode, icon: '🔍', title: t('inspect.full'), sub: t('inspect.full_sub') }].map(opt => (
                                <button key={opt.mode} onClick={() => { setMode(opt.mode); setStage('machine') }}
                                    className="glass glow-hover"
                                    style={{ padding: 40, borderRadius: 20, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: '#fff', transition: 'all 0.2s' }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>{opt.icon}</div>
                                    <div className="bebas" style={{ fontSize: 28, color: '#F0A500', marginBottom: 8 }}>{opt.title}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: 15 }}>{opt.sub}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* MACHINE SELECT */}
                {stage === 'machine' && (
                    <div className="animate-fade-in">
                        <button onClick={() => setStage('mode')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}>← Back</button>
                        <h2 className="bebas" style={{ fontSize: 40, marginBottom: 32 }}>{t('inspect.select_machine')}</h2>
                        <WeatherBanner />

                        {/* Brand selector */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 28, marginTop: 24 }}>
                            {['CAT', 'JCB'].map(b => (
                                <button key={b} onClick={() => { setSelectedBrand(b); setSelectedType(''); setSelectedModel('') }}
                                    style={{ padding: '10px 24px', borderRadius: 10, border: `2px solid ${selectedBrand === b ? '#F0A500' : 'var(--border)'}`, background: selectedBrand === b ? 'rgba(240,165,0,0.12)' : 'rgba(255,255,255,0.03)', color: selectedBrand === b ? '#F0A500' : 'var(--muted)', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>
                                    {b === 'CAT' ? '🐱 CAT' : '🟡 JCB'}
                                </button>
                            ))}
                        </div>

                        {/* Machine type grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                            {ALL_BRANDS.find(b => b.brand === selectedBrand)?.types.map(([key, machine]: [string, any]) => (
                                <button key={key} onClick={() => { setSelectedType(key); setSelectedModel(machine.models[0]) }}
                                    style={{ padding: '20px 12px', borderRadius: 14, border: `2px solid ${selectedType === key ? '#F0A500' : 'var(--border)'}`, background: selectedType === key ? 'rgba(240,165,0,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center', color: '#fff', transition: 'all 0.2s' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>{machine.icon}</div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{machine.label}</div>
                                    {LIFTING_TYPES.includes(key) && <div style={{ color: '#F0A500', fontSize: 11, marginTop: 4, fontWeight: 700 }}>🏋️ LIFTING</div>}
                                </button>
                            ))}
                        </div>

                        {/* Model chips */}
                        {selectedType && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                                {(ALL_BRANDS.find(b => b.brand === selectedBrand)?.types.find(([k]) => k === selectedType)?.[1] as any)?.models?.map((m: string) => (
                                    <button key={m} onClick={() => setSelectedModel(m)}
                                        style={{ padding: '6px 16px', borderRadius: 100, border: `1px solid ${selectedModel === m ? '#F0A500' : 'var(--border)'}`, background: selectedModel === m ? 'rgba(240,165,0,0.12)' : 'transparent', color: selectedModel === m ? '#F0A500' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Lifting warning */}
                        {isLifting && (
                            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, color: '#f87171', fontSize: 14 }}>
                                <strong>⚠️ LIFTING EQUIPMENT</strong> — Additional safety checks required. Mast, forks, chains, SLI, and outriggers will be inspected. Any critical finding = immediate NO-GO.
                            </div>
                        )}

                        {/* Form */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                            {[['Serial Number', serial, setSerial, t('inspect.serial')], ['SMU / Hours', smu, setSmu, t('inspect.hours')], ['Site Name', site, setSite, t('inspect.site')], ['Inspector Name', inspector, setInspector, t('inspect.inspector')]].map(([, val, setter, label]: any) => (
                                <div key={label}>
                                    <label style={{ display: 'block', marginBottom: 6, color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{label}</label>
                                    <input value={val} onChange={e => setter(e.target.value)}
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: '#fff', fontSize: 15 }}
                                        placeholder={label} />
                                </div>
                            ))}
                        </div>

                        <button onClick={startInspection} disabled={!selectedType || !selectedModel} className="btn-brand"
                            style={{ padding: '16px 40px', fontSize: 17, opacity: !selectedType || !selectedModel ? 0.5 : 1, cursor: !selectedType || !selectedModel ? 'not-allowed' : 'pointer' }}>
                            Begin Inspection →
                        </button>
                    </div>
                )}

                {/* WALKAROUND */}
                {stage === 'walkaround' && (
                    <div className="animate-fade-in">
                        {/* NO-GO Alert overlay */}
                        {nogoAlert && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(239,68,68,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 40, animation: 'pulse-nogo 1.5s ease' }}>
                                <div style={{ fontSize: 60, marginBottom: 16 }}>🛑</div>
                                <div className="bebas" style={{ fontSize: 64, letterSpacing: 2, marginBottom: 8 }}>NO-GO</div>
                                <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.9 }}>
                                    {language === 'es' ? 'No operar esta máquina' : 'Do Not Operate This Machine'}
                                </div>
                                <div style={{ maxWidth: 500, opacity: 0.85, fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>{result?.finding}</div>
                                <button onClick={() => setNogoAlert(false)} style={{ background: '#fff', color: '#ef4444', border: 'none', borderRadius: 16, padding: '18px 40px', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
                                    {language === 'es' ? 'Entendido — No Operaré' : 'I Understand — Do Not Operate'}
                                </button>
                            </div>
                        )}

                        {/* Progress */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--muted)' }}>
                                <span>{selectedBrand} {selectedModel} — {mode === 'quick' ? 'Quick Check' : 'Full Inspection'}</span>
                                <span>{doneItems}/{totalItems} done</span>
                            </div>
                            <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${(doneItems / totalItems) * 100}%`, background: 'linear-gradient(90deg, #F0A500, #22c55e)', borderRadius: 2, transition: 'width 0.3s' }} />
                            </div>
                        </div>

                        <WeatherBanner />

                        {/* AR toggle for lifting equipment */}
                        {isLifting && (
                            <div style={{ marginTop: 16, marginBottom: 24 }}>
                                <button onClick={() => setArActive(a => !a)}
                                    style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${arActive ? '#F0A500' : 'var(--border)'}`, background: arActive ? 'rgba(240,165,0,0.12)' : 'rgba(255,255,255,0.04)', color: arActive ? '#F0A500' : 'var(--muted)', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📷 {arActive ? 'Stop AR Scan' : `${t('inspect.live_scan')} — Point at lifting components`}
                                </button>
                                {arActive && <div style={{ marginTop: 16 }}><ARLabeling machineModel={`${selectedBrand} ${selectedModel}`} active={arActive} onSelect={(d) => { setArActive(false); setVoiceNote(d.label) }} /></div>}
                            </div>
                        )}

                        {/* Current component */}
                        <div className="glass" style={{ padding: 32, borderRadius: 20, marginBottom: 24, marginTop: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 32 }}>{currentComp?.icon || currentSection?.icon || '🔍'}</span>
                                <div>
                                    {mode === 'full' && <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 2 }}>{currentSection?.name} · {compIdx + 1}/{currentSection?.components.length}</div>}
                                    <div style={{ fontWeight: 800, fontSize: 20 }}>{mode === 'quick' ? currentComp?.name : currentSection?.components[compIdx]}</div>
                                </div>
                            </div>

                            {!result ? (
                                <>
                                    <PhotoCapture onCapture={setPhoto} label={t('inspect.take_photo')} />
                                    <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                                        <button onClick={analyzeComponent} disabled={!photo && !voiceNote || analyzing}
                                            className="btn-brand" style={{ flex: 1, padding: '14px', fontSize: 16, opacity: (!photo && !voiceNote) || analyzing ? 0.7 : 1, cursor: (!photo && !voiceNote) || analyzing ? 'not-allowed' : 'pointer' }}>
                                            {analyzing ? t('inspect.analyzing') : '🔍 Analyze'}
                                        </button>
                                        <button onClick={markGo} className="btn-ghost" style={{ padding: '14px 20px', fontSize: 16 }}>✅ {t('inspect.mark_go')}</button>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <StatusBadge status={result.status} size="lg" />
                                    <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6 }}>{result.finding}</p>
                                    {result.action?.parts_needed?.length > 0 && (
                                        <div style={{ marginTop: 16, background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 12, padding: 16 }}>
                                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#F0A500', fontSize: 13 }}>🔩 PARTS NEEDED</div>
                                            {result.action.parts_needed.map((p: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < result.action.parts_needed.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                                    <div>
                                                        <span className="mono" style={{ color: '#F0A500', fontWeight: 700 }}>{p.part_number}</span>
                                                        <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 14 }}>{p.part_name}</span>
                                                    </div>
                                                    <a href={p.order_url} target="_blank" style={{ color: '#F0A500', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Order →</a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={nextComponent} className="btn-brand" style={{ marginTop: 20, padding: '14px 32px', fontSize: 16 }}>
                                        Next Component →
                                    </button>
                                </div>
                            )}
                        </div>

                        {doneItems >= 3 && (
                            <button onClick={finishInspection} className="btn-ghost" style={{ width: '100%', padding: 16, fontSize: 16, marginTop: 8 }}>
                                ✓ Complete Inspection
                            </button>
                        )}
                    </div>
                )}

                {/* RESULTS */}
                {stage === 'results' && finalResult && (
                    <div className="animate-fade-in">
                        <h2 className="bebas" style={{ fontSize: 48, marginBottom: 24 }}>INSPECTION COMPLETE</h2>

                        {/* Big status */}
                        <div style={{ padding: '40px', borderRadius: 24, background: finalResult.overall_status === 'GO' ? 'rgba(34,197,94,0.06)' : finalResult.overall_status === 'CAUTION' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${finalResult.overall_status === 'GO' ? 'rgba(34,197,94,0.3)' : finalResult.overall_status === 'CAUTION' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`, textAlign: 'center', marginBottom: 32 }}>
                            <StatusBadge status={finalResult.overall_status} size="xl" />
                            <div style={{ marginTop: 16, color: 'var(--muted)', fontSize: 16 }}>
                                {finalResult.overall_status === 'GO' ? '✅ Machine cleared for operation' : finalResult.overall_status === 'CAUTION' ? '⚠️ Schedule maintenance — monitor closely' : '🛑 Do not operate — immediate repair required'}
                            </div>
                        </div>

                        <RiskGauge score={finalResult.risk_score} size={240} />

                        {/* Summary counts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, margin: '32px 0' }}>
                            {[['GO', finalResult.go_count, '#22c55e'], ['CAUTION', finalResult.caution_count, '#f59e0b'], ['NO-GO', finalResult.nogo_count, '#ef4444']].map(([s, n, c]) => (
                                <div key={s as string} className="glass" style={{ padding: 24, textAlign: 'center', borderRadius: 16 }}>
                                    <div className="bebas" style={{ fontSize: 40, color: c as string }}>{n as number}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{s as string}</div>
                                </div>
                            ))}
                        </div>

                        {/* Weather note */}
                        {weather.isFreezingCold && <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, color: '#60a5fa', fontSize: 14 }}>❄️ Note: Cold weather ({weather.temp}°F) may have contributed to seal and hydraulic findings. Monitor more frequently in winter.</div>}

                        {/* Blockchain badge */}
                        {blockchainSig ? (
                            <div style={{ background: 'rgba(153,69,255,0.08)', border: '1px solid rgba(153,69,255,0.3)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                                <div style={{ color: '#9945FF', fontWeight: 800, marginBottom: 8 }}>⛓️ BLOCKCHAIN VERIFIED</div>
                                <div className="mono" style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12 }}>{blockchainSig.slice(0, 16)}...{blockchainSig.slice(-16)}</div>
                                <a href={`https://explorer.solana.com/tx/${blockchainSig}?cluster=devnet`} target="_blank" style={{ color: '#9945FF', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>View on Solana Explorer →</a>
                            </div>
                        ) : (
                            <button onClick={verifyBlockchain} disabled={verifying} style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.3)', color: '#9945FF', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 16 }}>
                                {verifying ? '⏳ Verifying...' : '⛓️ Verify on Blockchain (Solana)'}
                            </button>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <button onClick={() => setStage('mode')} className="btn-brand" style={{ padding: '16px', fontSize: 16 }}>+ New Inspection</button>
                            <a href={`/verify/${blockchainSig}`} className="btn-ghost" style={{ padding: '16px', fontSize: 16, textDecoration: 'none', textAlign: 'center', display: 'block', borderRadius: 12 }}>🔗 Share Report</a>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
