'use client'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWeather } from '@/contexts/WeatherContext'
import { workerUrl } from '@/lib/utils'

export default function CabPage() {
    const { t, language } = useLanguage()
    const weather = useWeather()
    const [listening, setListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [response, setResponse] = useState('')
    const [processing, setProcessing] = useState(false)
    const recognitionRef = useRef<any>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const LANG_CODES: Record<string, string> = { en: 'en-US', es: 'es-MX', pt: 'pt-BR', fr: 'fr-FR', zh: 'zh-CN' }

    function startListening() {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SR) return
        const rec = new SR()
        rec.lang = LANG_CODES[language] || 'en-US'
        rec.continuous = false
        rec.onstart = () => setListening(true)
        rec.onresult = (e: any) => {
            const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
            setTranscript(text)
            handleVoiceCommand(text)
        }
        rec.onend = () => setListening(false)
        recognitionRef.current = rec
        rec.start()
    }

    async function handleVoiceCommand(text: string) {
        setProcessing(true)
        try {
            const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY || ''}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: `You are FieldMind Cab Voice Agent. Answer briefly in ${language === 'es' ? 'Spanish' : 'English'}. You help equipment operators with inspection questions, maintenance, and safety. Keep answers under 2 sentences. Focus on CAT and JCB equipment.` },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 150
                })
            })
            const data: any = await aiRes.json()
            const reply = data.choices?.[0]?.message?.content || 'Response unavailable'
            setResponse(reply)
            // TTS via worker
            const ttsRes = await fetch(workerUrl('/api/tts'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: reply, language })
            })
            if (ttsRes.ok) {
                const blob = await ttsRes.blob()
                const url = URL.createObjectURL(blob)
                if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }
            }
        } finally { setProcessing(false) }
    }

    const hints = language === 'es'
        ? ['¿Qué está mal?', '¿Nivel de aceite?', 'Iniciar inspección', '¿Horas para servicio?']
        : ["What's wrong?", "Oil level?", "Start inspection", "Hours to service?"]

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <audio ref={audioRef} style={{ display: 'none' }} />

            {/* Top bar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="bebas" style={{ fontSize: 22, color: '#F0A500' }}>FIELDMIND</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>CAB MODE</span>
                <a href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 20 }}>✕</a>
            </div>

            {/* Weather strip */}
            {weather.loaded && (weather.isFreezingCold || weather.isVeryHot) && (
                <div style={{ padding: '8px 24px', background: weather.isFreezingCold ? 'rgba(96,165,250,0.15)' : 'rgba(239,68,68,0.15)', textAlign: 'center', color: weather.isFreezingCold ? '#60a5fa' : '#f87171', fontSize: 13, fontWeight: 700 }}>
                    {weather.isFreezingCold ? `❄️ ${weather.temp}°F — Cold protocol active` : `☀️ ${weather.temp}°F — Heat advisory active`}
                </div>
            )}

            {/* Response display */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                {response && (
                    <div style={{ maxWidth: 600, textAlign: 'center', marginBottom: 48, animation: 'fadeIn 0.3s ease' }}>
                        {transcript && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 16, fontStyle: 'italic' }}>"{transcript}"</div>}
                        <div style={{ fontSize: 22, lineHeight: 1.6, color: '#fff', fontWeight: 500 }}>{response}</div>
                    </div>
                )}

                {/* BIG VOICE BUTTON */}
                <button
                    onMouseDown={startListening} onMouseUp={() => recognitionRef.current?.stop()}
                    onTouchStart={startListening} onTouchEnd={() => recognitionRef.current?.stop()}
                    style={{
                        width: 200, height: 200, borderRadius: '50%',
                        background: listening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #F0A500, #d4911e)',
                        border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                        animation: listening ? 'pulse-nogo 1.5s infinite' : processing ? 'pulse-brand 1s infinite' : 'none',
                        boxShadow: `0 0 60px ${listening ? 'rgba(239,68,68,0.5)' : 'rgba(240,165,0,0.4)'}`,
                        transition: 'all 0.2s'
                    }}>
                    <span style={{ fontSize: 48 }}>{listening ? '🎙️' : processing ? '⟳' : '🎤'}</span>
                    <span className="bebas" style={{ fontSize: 18, color: '#000', letterSpacing: 1 }}>
                        {listening ? t('cab.listening') : processing ? t('cab.processing') : t('cab.hold')}
                    </span>
                </button>

                {/* Hint chips */}
                <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {hints.map(h => (
                        <button key={h} onClick={() => handleVoiceCommand(h)}
                            style={{ padding: '10px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>
                            {h}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom action row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[['📷', t('cab.capture'), '/inspect'], ['📋', t('cab.checklist'), '/inspect'], ['🔧', t('cab.workorder'), '/inspect'], ['📞', t('cab.dealer'), 'tel:+18774882582']].map(([icon, label, href]: any) => (
                    <a key={label} href={href} style={{ padding: '20px 12px', textAlign: 'center', textDecoration: 'none', color: '#fff', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 26 }}>{icon}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                    </a>
                ))}
            </div>
        </div>
    )
}
