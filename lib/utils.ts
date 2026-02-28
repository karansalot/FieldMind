import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STATUS_CONFIG, type InspectionStatus, type Language } from './cat-knowledge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateId(): string {
    return crypto.randomUUID()
}

export function generateReportNumber(): string {
    const d = new Date()
    const date = d.toISOString().slice(0, 10).replace(/-/g, '')
    const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `FM-${date}-${num}`
}

export function formatDate(iso: string, lang: Language = 'en'): string {
    try {
        return new Date(iso).toLocaleDateString(
            lang === 'es' ? 'es-MX' : lang === 'pt' ? 'pt-BR' : lang === 'fr' ? 'fr-FR' : lang === 'zh' ? 'zh-CN' : 'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' }
        )
    } catch {
        return iso
    }
}

export function getStatusColor(status: InspectionStatus | string): string {
    const cfg = STATUS_CONFIG[status as InspectionStatus]
    return cfg?.color || '#94a3b8'
}

export function getStatusBg(status: InspectionStatus | string): string {
    const cfg = STATUS_CONFIG[status as InspectionStatus]
    return cfg?.bg || 'rgba(148,163,184,0.08)'
}

export function getStatusLabel(status: InspectionStatus | string, lang: Language = 'en'): string {
    const cfg = STATUS_CONFIG[status as InspectionStatus]
    return cfg?.labels?.[lang] || status
}

export function workerUrl(path: string): string {
    const base = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'
    return `${base}${path}`
}

export function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export function vibrate(pattern: number[]): void {
    if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern)
    }
}
