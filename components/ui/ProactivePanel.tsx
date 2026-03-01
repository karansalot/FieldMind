import { cn } from '@/lib/utils'
import { AlertCircle, Wrench, Settings, AlertTriangle, CloudRain } from 'lucide-react'

export function ProactivePanel({
    proactive
}: {
    proactive: {
        next_service_due?: string;
        related_checks?: string[];
        operator_coaching?: string;
        order_parts_now?: boolean;
        weather_note?: string;
    }
}) {
    if (!proactive || Object.keys(proactive).length === 0) return null

    return (
        <div className="w-full rounded-lg border border-[rgba(240,165,0,0.2)] bg-[rgba(240,165,0,0.05)] p-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-[#F0A500]" />
                <span className="mono text-[#F0A500] font-semibold tracking-wide">FIELDMIND RECOMMENDS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {proactive.next_service_due && (
                    <div className="flex flex-col bg-black/40 p-3 rounded border border-white/5">
                        <span className="text-muted text-xs uppercase flex items-center gap-1 mb-1"><Settings size={12} /> Next Service Due</span>
                        <span className="text-white text-sm">{proactive.next_service_due}</span>
                    </div>
                )}

                {proactive.operator_coaching && (
                    <div className="flex flex-col bg-black/40 p-3 rounded border border-white/5">
                        <span className="text-muted text-xs uppercase flex items-center gap-1 mb-1"><AlertTriangle size={12} /> Operator Coaching</span>
                        <span className="text-white text-sm">{proactive.operator_coaching}</span>
                    </div>
                )}

                {proactive.related_checks && proactive.related_checks.length > 0 && (
                    <div className="flex flex-col bg-black/40 p-3 rounded border border-white/5">
                        <span className="text-muted text-xs uppercase flex items-center gap-1 mb-1"><Wrench size={12} /> Related Checks</span>
                        <span className="text-white text-sm">{proactive.related_checks.join(', ')}</span>
                    </div>
                )}

                {proactive.weather_note && (
                    <div className="flex flex-col bg-black/40 p-3 rounded border border-white/5">
                        <span className="text-muted text-xs uppercase flex items-center gap-1 mb-1"><CloudRain size={12} /> Weather Advisory</span>
                        <span className="text-white text-sm">{proactive.weather_note}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
