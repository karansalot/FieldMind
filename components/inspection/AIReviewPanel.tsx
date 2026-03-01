'use client'
import { useState } from 'react'
import { Sparkles, Check, Edit2, CornerDownRight } from 'lucide-react'

interface Props {
    initialFindings: {
        status: string
        finding: string
        confidence: number
    }
    onAccept: (editedAiFindings: any) => void
    onReject: () => void
}

export default function AIReviewPanel({ initialFindings, onAccept, onReject }: Props) {
    const [editing, setEditing] = useState(false)
    const [editedFinding, setEditedFinding] = useState(initialFindings.finding)
    const [userCorrection, setUserCorrection] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [status, setStatus] = useState(initialFindings.status)

    // Human-in-the-loop chat correction
    const handleCorrectionSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userCorrection.trim()) return

        setIsProcessing(true)

        const combinedText = `Original finding: ${editedFinding}. Inspector correction: ${userCorrection}. Rewrite as a single professional sentence.`
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'}/api/refine-note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: combinedText })
            })
            const data = await res.json()
            if (data.refined) setEditedFinding(data.refined)
            else setEditedFinding(`[Correction: ${userCorrection}] ${editedFinding}`)
        } catch (e) {
            setEditedFinding(`[Correction: ${userCorrection}] ${editedFinding}`)
        }

        setUserCorrection('')
        setIsProcessing(false)
    }

    return (
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl overflow-hidden mt-6">

            {/* Header */}
            <div className="bg-indigo-500/10 px-4 py-3 flex items-center justify-between border-b border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    AI Analysis generated
                </div>
                <div className="text-xs text-white/40 flex items-center gap-1">
                    Confidence <span className="text-white/80 font-mono">{initialFindings.confidence}%</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Status indicator override */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-white/50">Status:</span>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm font-bold w-32 outline-none focus:border-indigo-500 transition"
                    >
                        <option value="GO" className="text-green-500">GO</option>
                        <option value="CAUTION" className="text-amber-500">CAUTION</option>
                        <option value="NO-GO" className="text-red-500">NO-GO</option>
                    </select>
                </div>

                {/* Text Area */}
                {editing ? (
                    <div className="relative">
                        <textarea
                            value={editedFinding}
                            onChange={(e) => setEditedFinding(e.target.value)}
                            className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-4 text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                        />
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={async () => {
                                setIsProcessing(true)
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'}/api/refine-note`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ text: editedFinding })
                                    })
                                    const data = await res.json()
                                    if (data.refined) setEditedFinding(data.refined)
                                } catch (e) { }
                                setIsProcessing(false)
                            }}
                            className="absolute bottom-3 right-3 bg-indigo-600/50 hover:bg-indigo-500/80 text-white text-xs px-2 py-1 rounded flex items-center transition"
                        >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Refine
                        </button>
                    </div>
                ) : (
                    <div className="text-gray-200 text-sm leading-relaxed p-4 bg-black/20 rounded-xl border border-white/5 relative group">
                        {editedFinding}
                        <button
                            onClick={() => setEditing(true)}
                            className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 rounded-md hover:bg-white/20"
                        >
                            <Edit2 className="w-4 h-4 text-white/70" />
                        </button>
                    </div>
                )}

                {/* Chat correction input */}
                <form onSubmit={handleCorrectionSubmit} className="relative mt-2">
                    <CornerDownRight className="absolute left-3 top-2.5 w-4 h-4 text-indigo-400/50" />
                    <input
                        type="text"
                        value={userCorrection}
                        onChange={e => setUserCorrection(e.target.value)}
                        placeholder="Tell AI to correct this (e.g. 'It's dust, not rust')..."
                        disabled={isProcessing}
                        className="w-full bg-indigo-950/30 border border-indigo-500/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-indigo-300/30 outline-none focus:border-indigo-500 transition disabled:opacity-50"
                    />
                    {isProcessing && (
                        <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </form>

                {/* Action Buttons */}
                <div className="pt-4 flex gap-3">
                    <button
                        onClick={onReject}
                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 font-medium text-white/70 hover:bg-white/5 transition"
                    >
                        Retake
                    </button>
                    <button
                        onClick={() => onAccept({ finding: editedFinding, status, override: true })}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-black hover:bg-primary/90 transition flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Save Finding
                    </button>
                </div>
            </div>
        </div>
    )
}
