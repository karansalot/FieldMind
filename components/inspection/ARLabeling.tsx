'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { workerUrl } from '@/lib/utils'

interface Detection {
    label: string
    part_number?: string
    status?: 'GO' | 'CAUTION' | 'NO-GO'
    confidence: number
    bbox: { x: number; y: number; w: number; h: number } // 0-1 normalized
}

interface Props {
    machineModel?: string
    onSelect?: (detection: Detection) => void
    active: boolean
}

const STATUS_COLORS = { GO: '#22c55e', CAUTION: '#f59e0b', 'NO-GO': '#ef4444' }

export default function ARLabeling({ machineModel, onSelect, active }: Props) {
    const { t, language } = useLanguage()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const frameRef = useRef<number>(0)
    const lastAnalysisRef = useRef<number>(0)
    const [detections, setDetections] = useState<Detection[]>([])
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fps, setFps] = useState(0)
    const fpsRef = useRef({ count: 0, last: Date.now() })

    // Start camera
    useEffect(() => {
        if (!active) { stopCamera(); return }
        startCamera()
        return () => stopCamera()
    }, [active])

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
        } catch (e) {
            setError('Camera access denied. Please allow camera permission.')
        }
    }

    function stopCamera() {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        cancelAnimationFrame(frameRef.current)
    }

    // Draw loop
    useEffect(() => {
        if (!active) return
        function loop() {
            drawOverlay()
            maybeAnalyze()
            updateFps()
            frameRef.current = requestAnimationFrame(loop)
        }
        frameRef.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frameRef.current)
    }, [active, detections])

    function updateFps() {
        fpsRef.current.count++
        const now = Date.now()
        if (now - fpsRef.current.last > 1000) {
            setFps(fpsRef.current.count)
            fpsRef.current = { count: 0, last: now }
        }
    }

    function captureFrame(): string | null {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState < 2) return null
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/jpeg', 0.6)
    }

    function drawOverlay() {
        const overlay = overlayRef.current
        const video = videoRef.current
        if (!overlay || !video) return
        overlay.width = video.clientWidth
        overlay.height = video.clientHeight
        const ctx = overlay.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, overlay.width, overlay.height)

        for (const d of detections) {
            const x = d.bbox.x * overlay.width
            const y = d.bbox.y * overlay.height
            const w = d.bbox.w * overlay.width
            const h = d.bbox.h * overlay.height
            const color = d.status ? STATUS_COLORS[d.status] || '#F0A500' : '#F0A500'

            // Box
            ctx.strokeStyle = color
            ctx.lineWidth = 2.5
            ctx.strokeRect(x, y, w, h)

            // Corner accents
            const cl = 16
            ctx.lineWidth = 4
            for (const [cx2, cy2, dx, dy] of [[x, y, cl, cl], [x + w, y, -cl, cl], [x, y + h, cl, -cl], [x + w, y + h, -cl, -cl]] as [number, number, number, number][]) {
                ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + dx, cy2); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2, cy2 + dy); ctx.stroke()
            }

            // Label pill
            const label = d.part_number ? `${d.label}  |  ${d.part_number}` : d.label
            ctx.font = 'bold 12px DM Mono, monospace'
            const tw = ctx.measureText(label).width + 20
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(x, y - 26, tw, 22, 5)
            ctx.fill()
            ctx.fillStyle = '#000'
            ctx.fillText(label, x + 10, y - 10)

            // Confidence
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.beginPath()
            ctx.roundRect(x, y + h + 4, 60, 18, 3)
            ctx.fill()
            ctx.fillStyle = color
            ctx.font = 'bold 10px DM Sans, sans-serif'
            ctx.fillText(`${d.confidence}%`, x + 6, y + h + 16)
        }

        // Scanning indicator
        if (scanning) {
            const w2 = overlay.width, h2 = overlay.height
            ctx.strokeStyle = 'rgba(240,165,0,0.5)'
            ctx.lineWidth = 2
            ctx.setLineDash([10, 5])
            const margin = 40
            ctx.strokeRect(margin, margin, w2 - margin * 2, h2 - margin * 2)
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.beginPath()
            ctx.roundRect(w2 / 2 - 60, h2 - 50, 120, 30, 8)
            ctx.fill()
            ctx.fillStyle = '#F0A500'
            ctx.font = 'bold 13px DM Sans'
            ctx.textAlign = 'center'
            ctx.fillText('⟳ ' + t('ar.scanning'), w2 / 2, h2 - 29)
            ctx.textAlign = 'left'
        }
    }

    async function maybeAnalyze() {
        const now = Date.now()
        if (now - lastAnalysisRef.current < 2500) return // throttle to every 2.5s
        lastAnalysisRef.current = now
        const frame = captureFrame()
        if (!frame) return
        setScanning(true)
        try {
            const resp = await fetch(workerUrl('/api/ar/analyze'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: frame,
                    machine_model: machineModel || 'CAT Equipment',
                    language
                })
            })
            if (resp.ok) {
                const data = await resp.json()
                if (Array.isArray(data.detections)) setDetections(data.detections)
            }
        } catch { /* network error — skip frame */ }
        setScanning(false)
    }

    if (!active) return null

    return (
        <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: '#000', minHeight: 280 }}>
            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', color: '#f87171', zIndex: 10, textAlign: 'center', padding: 24 }}>
                    <div>⚠️<br />{error}</div>
                </div>
            )}

            {/* Live video feed */}
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* AR overlay canvas */}
            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

            {/* HUD */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(240,165,0,0.4)', borderRadius: 6, padding: '3px 10px', color: '#F0A500', fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700 }}>
                    ● LIVE  {fps}fps
                </div>
                <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 10px', color: 'var(--muted)', fontSize: 11 }}>
                    {machineModel || 'CAT Equipment'}
                </div>
            </div>

            {/* Detection count */}
            {detections.length > 0 && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12 }}>
                    {detections.length} component{detections.length !== 1 ? 's' : ''} detected
                </div>
            )}

            {/* Clickable detection areas */}
            {detections.map((d, i) => (
                <div key={i} onClick={() => onSelect?.(d)} style={{
                    position: 'absolute',
                    left: `${d.bbox.x * 100}%`,
                    top: `${d.bbox.y * 100}%`,
                    width: `${d.bbox.w * 100}%`,
                    height: `${d.bbox.h * 100}%`,
                    cursor: 'pointer',
                    zIndex: 5,
                }} />
            ))}

            {/* Aim prompt when no detections */}
            {detections.length === 0 && !scanning && (
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'var(--muted)', fontSize: 13, padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {t('ar.aim_at')}
                </div>
            )}
        </div>
    )
}
