'use client'
import { useRef, useEffect } from 'react'

export default function ParticleField({ height = '100%' }: { height?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animId: number
        let mouse = { x: 0, y: 0 }

        function resize() {
            canvas!.width = canvas!.offsetWidth
            canvas!.height = canvas!.offsetHeight
        }
        resize()
        window.addEventListener('resize', resize)

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas!.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top
        })

        // Particles
        const N = 200
        const particles = Array.from({ length: N }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.85 ? '#F0A500' : '#ffffff',
        }))

        function draw() {
            if (!ctx || !canvas) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw connections
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 90) {
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(240,165,0,${0.03 * (1 - dist / 90)})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }

            // Draw particles
            for (const p of particles) {
                // Mouse influence
                const dx = mouse.x - p.x
                const dy = mouse.y - p.y
                const d = Math.sqrt(dx * dx + dy * dy)
                if (d < 120) {
                    p.vx += dx * 0.00002
                    p.vy += dy * 0.00002
                }

                p.x += p.vx
                p.y += p.vy

                // Clamp velocity
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                if (speed > 0.8) { p.vx *= 0.98; p.vy *= 0.98 }

                // Wrap
                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = p.color === '#F0A500'
                    ? `rgba(240,165,0,${p.alpha})`
                    : `rgba(255,255,255,${p.alpha})`
                ctx.fill()
            }

            animId = requestAnimationFrame(draw)
        }

        draw()
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height, pointerEvents: 'none', zIndex: 0 }}
        />
    )
}
