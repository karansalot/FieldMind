'use client'
import { useRef, useState, useCallback } from 'react'
import { imageToBase64 } from '@/lib/utils'

interface Props {
    onCapture: (base64: string) => void
    onVoiceNote?: (text: string) => void
    label?: string
}

export default function PhotoCapture({ onCapture, label = 'Take Photo' }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [warning, setWarning] = useState<string | null>(null)
    const [dragging, setDragging] = useState(false)

    const processFile = useCallback(async (file: File) => {
        setWarning(null)
        const b64 = await imageToBase64(file)

        // Basic quality checks  
        const img = new Image()
        img.onload = () => {
            // check blur / dark via canvas sampling
            const c = document.createElement('canvas')
            c.width = img.width; c.height = img.height
            const ctx = c.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            const data = ctx.getImageData(0, 0, c.width, c.height).data
            let total = 0
            for (let i = 0; i < data.length; i += 4) total += (data[i] + data[i + 1] + data[i + 2]) / 3
            const avg = total / (data.length / 4)
            if (avg < 30) setWarning('⚠️ Image looks very dark — consider turning on flashlight')
            else if (img.width < 200 || img.height < 200) setWarning('⚠️ Move closer to the component for better analysis')
        }
        img.src = b64

        setPreview(b64)
        onCapture(b64)
    }, [onCapture])

    const handleFile = useCallback((f: File | undefined) => {
        if (!f) return
        processFile(f)
    }, [processFile])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? '#F0A500' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 16,
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragging ? 'rgba(240,165,0,0.04)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {preview ? (
                    <div style={{ position: 'relative' }}>
                        <img src={preview} alt="Captured" style={{ maxHeight: 200, borderRadius: 12, objectFit: 'cover', width: '100%' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', borderRadius: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 }}>
                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Tap to retake</span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                        <div style={{ color: 'var(--muted)', fontSize: 14 }}>{label} — tap or drag photo here</div>
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 }}>Supports JPG, PNG, HEIC</div>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
            </div>

            {warning && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f59e0b', fontSize: 13 }}>
                    {warning}
                </div>
            )}
        </div>
    )
}
