'use client'

import { useState } from 'react'
import { Mic, Loader2, Square } from 'lucide-react'
import { useVoice } from '@/hooks/useVoice'
import { cn } from '@/lib/utils'

interface VoiceButtonProps {
    onTranscript: (text: string) => void
    disabled?: boolean
    className?: string
    language?: string
}

export function VoiceButton({ onTranscript, disabled = false, className, language = 'en' }: VoiceButtonProps) {
    const { isListening, transcript, startListening, stopListening } = useVoice()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleToggle = () => {
        if (isListening) {
            stopListening()
            setIsProcessing(true)
            // Small delay to allow final transcript piece
            setTimeout(() => {
                if (transcript) onTranscript(transcript)
                setIsProcessing(false)
            }, 500)
        } else {
            startListening()
        }
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <button
                onClick={handleToggle}
                disabled={disabled || isProcessing}
                className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isListening ? "bg-red-500 animate-pulse text-white hover:bg-red-600" :
                        isProcessing ? "bg-gray-700 text-gray-300" :
                            "bg-[#F0A500] hover:bg-[#d99600] text-black",
                    disabled && "opacity-50 cursor-not-allowed hover:bg-[#F0A500]"
                )}
            >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> :
                    isListening ? <Square size={18} fill="currentColor" /> :
                        <Mic size={20} />}
            </button>

            {isListening && (
                <div className="flex-1 bg-black/40 rounded p-3 border border-red-500/30 overflow-hidden text-sm relative">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded"></div>
                    <span className="text-white relative z-10">{transcript || 'Listening...'}</span>
                </div>
            )}
        </div>
    )
}
