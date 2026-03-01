import { cn } from '@/lib/utils'
import { ExternalLink, Copy, CheckCircle } from 'lucide-react'

export function BlockchainBadge({ signature, explorer_url, verified_at }: { signature: string; explorer_url: string; verified_at: string }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(signature)
    }

    return (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-[rgba(153,69,255,0.08)] border border-[rgba(153,69,255,0.25)] relative overflow-hidden group">
            <div className="flex items-center gap-2 text-[#9945FF] mono text-sm font-semibold">
                <span className="text-lg">⛓️</span> BLOCKCHAIN VERIFIED
            </div>

            <div className="flex justify-between items-center mt-2">
                <span className="text-muted text-xs uppercase tracking-wider">Network</span>
                <span className="text-white text-sm">Solana Devnet</span>
            </div>

            <div className="flex justify-between items-center cursor-pointer hover:bg-[rgba(255,255,255,0.05)] p-1 rounded -mx-1 transition-colors" onClick={handleCopy}>
                <span className="text-muted text-xs uppercase tracking-wider">Signature</span>
                <div className="flex items-center gap-2">
                    <span className="text-white mono text-xs">{signature.slice(0, 8)}...{signature.slice(-8)}</span>
                    <Copy size={12} className="text-muted group-hover:text-white transition-colors" />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-muted text-xs uppercase tracking-wider">Verified</span>
                <span className="text-white text-sm">{new Date(verified_at).toLocaleDateString()}</span>
            </div>

            <a
                href={explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-[rgba(153,69,255,0.15)] hover:bg-[rgba(153,69,255,0.25)] text-[#9945FF] rounded transition-colors text-sm font-medium"
            >
                View on Solana Explorer <ExternalLink size={14} />
            </a>
        </div>
    )
}
