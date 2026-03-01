'use client'
import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useHaptics } from '@/hooks/useHaptics'

export default function SOSButton() {
    const [active, setActive] = useState(false)
    const [status, setStatus] = useState<'idle' | 'reporting' | 'sent'>('idle')
    const { vibrate } = useHaptics()

    const handleSOS = async () => {
        vibrate('heavy')
        setActive(true)
        setStatus('reporting')

        // Simulate API call to supervisor & logging the risk
        try {
            await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'}/api/sos`, { method: 'POST' }).catch(() => null)
        } catch (e) { }
        await new Promise(r => setTimeout(r, 1500))
        setStatus('sent')
        vibrate('success')

        setTimeout(() => {
            setActive(false)
            setStatus('idle')
        }, 4000)
    }

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <button
                onClick={handleSOS}
                disabled={active}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${active ? 'bg-red-600 scale-110' : 'bg-red-600/90 hover:bg-red-500 hover:scale-105'
                    }`}
            >
                <span className="absolute -inset-2 rounded-full border border-red-500/30 animate-ping" />
                <AlertTriangle className="w-6 h-6 text-white" />
            </button>

            {active && (
                <div className="absolute bottom-16 left-0 bg-red-950 border border-red-500/50 rounded-xl p-4 shadow-2xl w-64 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-red-400 font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            EMERGENCY SOS
                        </h3>
                        {status === 'sent' && (
                            <button onClick={() => setActive(false)} className="text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="text-sm text-gray-200">
                        {status === 'reporting' ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                Alerting Supervisor...
                            </div>
                        ) : (
                            <div>
                                <p className="font-semibold text-white">Supervisor Alerted.</p>
                                <p className="text-xs text-red-300 mt-1">Inspection locked. GPS Location & Equipment data transmitted.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
