const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'

async function apiFetch(path: string, options?: RequestInit) {
    const deviceId = typeof window !== 'undefined'
        ? (localStorage.getItem('fm_device_id') || (() => { const id = crypto.randomUUID(); localStorage.setItem('fm_device_id', id); return id })())
        : 'server'

    const res = await fetch(`${WORKER_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'X-Device-ID': deviceId, ...options?.headers }
    })
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
        throw new Error((error as any).error?.message || `API error ${res.status}`)
    }
    return res.json()
}

export const api = {
    health: () => apiFetch('/api/health'),
    weather: (lat?: number, lon?: number) => apiFetch(`/api/weather${lat ? `?lat=${lat}&lon=${lon}` : ''}`),
    checklist: (lang = 'en') => apiFetch(`/api/checklist?lang=${lang}`),
    machines: () => apiFetch('/api/machines'),

    inspections: {
        create: (body: any) => apiFetch('/api/inspections', { method: 'POST', body: JSON.stringify(body) }),
        list: (params?: { limit?: number; status?: string; machine?: string }) => {
            const qs = new URLSearchParams(params as any).toString()
            return apiFetch(`/api/inspections${qs ? '?' + qs : ''}`)
        },
        get: (id: string) => apiFetch(`/api/inspections/${id}`),
        addItem: (id: string, body: any) => apiFetch(`/api/inspections/${id}/items`, { method: 'POST', body: JSON.stringify(body) }),
        complete: (id: string) => apiFetch(`/api/inspections/${id}/complete`, { method: 'POST', body: '{}' }),
        anchorSolana: (id: string) => apiFetch(`/api/inspections/${id}/anchor-solana`, { method: 'POST', body: '{}' }),
        getReport: (id: string) => apiFetch(`/api/inspections/${id}/report`),
        downloadPDF: async (id: string) => {
            const deviceId = typeof window !== 'undefined'
                ? (localStorage.getItem('fm_device_id') || 'anonymous') : 'server'
            const res = await fetch(`${WORKER_URL}/api/inspections/${id}/report?format=pdf`, {
                headers: { 'X-Device-ID': deviceId }
            })
            if (!res.ok) throw new Error('PDF download failed')
            return res.blob()
        }
    },

    voice: {
        parseIntent: (body: { transcript?: string; text?: string; language?: string }) =>
            apiFetch('/api/voice/transcribe-intent', { method: 'POST', body: JSON.stringify(body) })
    },

    parts: {
        identify: (body: { image_base64?: string; description?: string; machine_model?: string; language?: string }) =>
            apiFetch('/api/parts/identify', { method: 'POST', body: JSON.stringify(body) })
    },

    tts: (text: string, language = 'en') =>
        apiFetch('/api/tts', { method: 'POST', body: JSON.stringify({ text, language }) }),

    fleet: {
        analytics: () => apiFetch('/api/fleet/analytics')
    },

    verify: (signature: string) => apiFetch(`/api/verify/${signature}`)
}
