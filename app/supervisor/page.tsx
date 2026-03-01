'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { AlertTriangle, Clock, ShieldAlert, Phone, ExternalLink } from 'lucide-react'
import { workerUrl } from '@/lib/utils'

export default function SupervisorPage() {
    const [incidents, setIncidents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch incidents from the backend or display a placeholder if not wired yet
        const fetchIncidents = async () => {
            try {
                // We're stubbing the incident fetch here for demo purposes 
                // In production this would hit our D1 db for NO-GO and EMERGENCY events
                const res = await fetch(workerUrl('/api/inspections?limit=10'))
                const data = await res.json()
                const noGoList = (data.data || []).filter((i: any) => i.overall_status === 'NO-GO')
                setIncidents(noGoList)
            } finally {
                setLoading(false)
            }
        }
        fetchIncidents()
    }, [])

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h1 className="bebas text-5xl tracking-wide text-white">Supervisor Command Center</h1>
                        <p className="text-[var(--muted)]">Active incidents and NO-GO escalations</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-white/10 rounded-3xl text-center">
                        <div className="bg-green-500/20 p-4 rounded-full mb-6">
                            <AlertTriangle className="w-12 h-12 text-green-500" />
                        </div>
                        <h3 className="bebas text-3xl mb-2">Zero Active Incidents</h3>
                        <p className="text-[var(--muted)]">All regional fleets are operating optimally with no immediate hazards.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {incidents.map((incident: any) => (
                            <div key={incident.id} className="relative overflow-hidden bg-gradient-to-r from-red-950/40 to-black/40 border border-red-500/30 rounded-2xl p-6 group hover:border-red-500/60 transition-all">
                                {/* Red glow indicator */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />

                                <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md tracking-wider">CRITICAL NO-GO</span>
                                            <span className="text-red-400 font-mono text-sm flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(incident.completed_at || incident.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white">
                                            {incident.machine_brand} {incident.machine_model} <span className="text-white/40 font-mono text-sm">[{incident.serial_number}]</span>
                                        </h3>
                                        <p className="text-white/70 text-sm">
                                            Reported by <span className="text-white font-medium">{incident.inspector_name}</span> at {incident.site_name}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <a
                                            href={`tel:+18005550199`}
                                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 mt-2 md:mt-0 rounded-xl text-sm font-medium transition"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call Inspector
                                        </a>
                                        {incident.id && (
                                            <a
                                                href={`/report/${incident.id}`}
                                                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2 mt-2 md:mt-0 rounded-xl font-bold shadow-lg shadow-red-900/50 transition truncate"
                                            >
                                                View Report
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}
