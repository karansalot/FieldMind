'use client'
import { useState, useRef } from 'react'
import { Mic, ArrowRight, Play, Square, Video, Camera } from 'lucide-react'
import { useHaptics } from '@/hooks/useHaptics'
import { imageToBase64 } from '@/lib/utils'

interface Props {
    onCapture: (mediaBase64: string, type: 'image' | 'video') => void
    label?: string
}

export default function PhotoCapture({ onCapture, label = 'Capture Media' }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const [mode, setMode] = useState<'photo' | 'video'>('photo')
    const [recording, setRecording] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [frames, setFrames] = useState<string[]>([])
    const chunks = useRef<Blob[]>([])

    const { vibrate } = useHaptics()

    // Native upload logic (fallback)
    const handleFile = async (f: File | undefined) => {
        if (!f) return
        const isVideo = f.type.startsWith('video/')
        setError(null)

        try {
            if (isVideo) {
                // Since we need to send base64 to worker, we convert video too
                // Note: For large videos in a real app, you'd use multipart uploads.
                const reader = new FileReader()
                reader.onload = () => {
                    setPreviewUrl(URL.createObjectURL(f))
                    onCapture(reader.result as string, 'video')
                }
                reader.readAsDataURL(f)
            } else {
                const b64 = await imageToBase64(f)
                setPreviewUrl(b64)
                onCapture(b64, 'image')
            }
        } catch (e) {
            setError('Failed to process media file.')
        }
    }

    // --- WebRTC Camera Logic ---

    const startCamera = async (type: 'photo' | 'video') => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: type === 'video'
            })
            setStream(s)
            setMode(type)
            setPreviewUrl(null)
            setError(null)
            if (videoRef.current) {
                videoRef.current.srcObject = s
            }
        } catch (e) {
            setError('Camera permission denied. Tap here to upload a file instead.')
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
            setStream(null)
        }
    }

    const takePhoto = () => {
        vibrate('light' as any)
        if (!videoRef.current) return
        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0)
            const b64 = canvas.toDataURL('image/jpeg', 0.8)
            setPreviewUrl(b64)
            stopCamera()
            onCapture(b64, 'image')
        }
    }

    const startRecording = () => {
        if (!stream) return
        vibrate('light' as any)
        chunks.current = []
        setFrames([])
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.current.push(e.data)
        }
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks.current, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            setPreviewUrl(url)

            const reader = new FileReader()
            reader.onload = () => {
                // Pass frames along with the video base64
                // Hacking the type slightly here due to our prop signature, we should update that but for now we append it
                onCapture(JSON.stringify({ video: reader.result, frames }), 'video')
            }
            reader.readAsDataURL(blob)
            stopCamera()
        }
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setRecording(true)

        // Frame extraction
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
        frameIntervalRef.current = setInterval(() => {
            if (videoRef.current && canvasRef.current) {
                const w = videoRef.current.videoWidth
                const h = videoRef.current.videoHeight
                if (w > 0 && h > 0) {
                    canvasRef.current.width = w
                    canvasRef.current.height = h
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        ctx.drawImage(videoRef.current, 0, 0, w, h)
                        setFrames(prev => [...prev, canvasRef.current!.toDataURL('image/jpeg', 0.8)])
                    }
                }
            }
        }, 2000)
    }

    const stopRecording = () => {
        vibrate('success' as any)
        mediaRecorderRef.current?.stop()
        setRecording(false)
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    }

    const retake = () => {
        setPreviewUrl(null)
        startCamera(mode)
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center min-h-[300px]">
                {previewUrl ? (
                    mode === 'video' ? (
                        <div className="w-full flex flex-col items-center">
                            <video src={previewUrl} controls className="w-full max-h-[300px] object-cover" />
                            {frames.length > 0 && (
                                <div className="mt-2 w-full px-2">
                                    <div className="text-xs text-indigo-300 font-semibold mb-2 uppercase tracking-wide">Extracted Video Frames ({frames.length})</div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {frames.map((frame, idx) => (
                                            <img key={idx} src={frame} alt={`Frame ${idx}`} className="h-16 w-24 object-cover rounded-lg border border-indigo-500/30 flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <img src={previewUrl} className="w-full max-h-[400px] object-cover" />
                    )
                ) : stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={mode === 'photo'}
                        className="w-full min-h-[300px] max-h-[400px] object-cover"
                    />
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition"
                    >
                        <Camera className="w-10 h-10 text-white/30 mb-2" />
                        <p className="text-white/50 text-sm font-medium">{error || 'Tap to choose file manually'}</p>
                    </div>
                )}

                {/* Retake Overlay */}
                {previewUrl && (
                    <button
                        onClick={() => {
                            setFrames([])
                            retake()
                        }}
                        className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/20 z-10"
                    >
                        Retake
                    </button>
                )}

                {/* Recording Indicator */}
                {recording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-white" />
                        REC
                    </div>
                )}
            </div>

            {/* Controls */}
            {!previewUrl && (
                <div className="flex justify-center items-center gap-6">
                    <button
                        onClick={() => startCamera('photo')}
                        className={`p-3 rounded-full transition ${mode === 'photo' && stream ? 'bg-primary text-black' : 'bg-white/10 text-white/70'}`}
                    >
                        <Camera className="w-5 h-5" />
                    </button>

                    <div className="flex-1 max-w-[120px]">
                        {stream ? (
                            mode === 'photo' ? (
                                <button
                                    onClick={takePhoto}
                                    className="w-16 h-16 mx-auto rounded-full border-4 border-white/30 bg-white hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center"
                                />
                            ) : (
                                <button
                                    onClick={recording ? stopRecording : startRecording}
                                    className={`w-16 h-16 mx-auto rounded-full border-4 border-white/30 transition-all active:scale-95 flex items-center justify-center ${recording ? 'bg-white' : 'bg-red-500'}`}
                                >
                                    {recording && <Square className="w-6 h-6 text-red-500 fill-current" />}
                                </button>
                            )
                        ) : (
                            <div className="text-center text-sm text-white/30">Camera Off</div>
                        )}
                    </div>

                    <button
                        onClick={() => startCamera('video')}
                        className={`p-3 rounded-full transition ${mode === 'video' && stream ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70'}`}
                    >
                        <Video className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Hidden manual input overlay */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
            />
        </div>
    )
}
