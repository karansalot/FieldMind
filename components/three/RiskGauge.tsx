'use client'
import { useRef, useEffect } from 'react'

export default function RiskGauge({ score, size = 200 }: { score: number; size?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const W = size * 2
        canvas.width = W
        canvas.height = W * 0.65

        const cx = W / 2
        const cy = W * 0.62
        const r = W * 0.42
        const startAngle = Math.PI

        const targetAngle = startAngle + (score / 100) * Math.PI
        let raf: number

        function getColor(s: number) {
            if (s <= 30) return '#22c55e'
            if (s <= 70) return '#f59e0b'
            return '#ef4444'
        }

        function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }

        let start: number | null = null
        const duration = 1200

        function anim(ts: number) {
            if (!ctx || !canvas) return
            if (!start) start = ts
            const elapsed = ts - start
            const progress = Math.min(elapsed / duration, 1)
            const currentAngle = startAngle + easeOut(progress) * (targetAngle - startAngle)

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Background arc
            ctx.beginPath()
            ctx.arc(cx, cy, r, startAngle, 2 * Math.PI)
            ctx.strokeStyle = 'rgba(255,255,255,0.06)'
            ctx.lineWidth = W * 0.06
            ctx.lineCap = 'round'
            ctx.stroke()

            // Glow
            ctx.shadowBlur = 20
            ctx.shadowColor = getColor(score * easeOut(progress))

            // Score arc
            ctx.beginPath()
            ctx.arc(cx, cy, r, startAngle, currentAngle)
            const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
            grad.addColorStop(0, '#22c55e')
            grad.addColorStop(0.5, '#f59e0b')
            grad.addColorStop(1, '#ef4444')
            ctx.strokeStyle = grad
            ctx.lineWidth = W * 0.06
            ctx.lineCap = 'round'
            ctx.stroke()
            ctx.shadowBlur = 0

            // Score text
            const displayScore = Math.round(score * easeOut(progress))
            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${W * 0.18}px 'Bebas Neue', sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(String(displayScore), cx, cy - W * 0.06)

            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = `${W * 0.07}px 'DM Sans', sans-serif`
            ctx.fillText('RISK SCORE', cx, cy + W * 0.1)

            if (progress < 1) raf = requestAnimationFrame(anim)
        }

        raf = requestAnimationFrame(anim)
        return () => cancelAnimationFrame(raf)
    }, [score, size])

    return (
        <canvas ref={canvasRef} style={{ width: size, height: size * 0.65, display: 'block', margin: '0 auto' }} />
    )
}
