export async function saveToSupermemory(data: { machine_model: string; serial_number: string; overall_status: string; risk_score: number; nogo_items: string[]; caution_items: string[]; smu_hours: number; report_number: string; inspection_id: string }, apiKey: string): Promise<void> {
    if (!apiKey) return
    const content = `FieldMind Inspection Record\nMachine: ${data.machine_model}\nSerial: ${data.serial_number || 'N/A'}\nReport: ${data.report_number}\nDate: ${new Date().toISOString()}\nSMU: ${data.smu_hours}\nStatus: ${data.overall_status}\nRisk: ${data.risk_score}/100\nNO-GO: ${data.nogo_items.join(', ') || 'None'}\nCAUTION: ${data.caution_items.join(', ') || 'None'}`
    await fetch('https://api.supermemory.ai/v3/memories', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, metadata: { machine_model: data.machine_model, serial_number: data.serial_number, overall_status: data.overall_status, inspection_id: data.inspection_id, type: 'inspection' } })
    })
}

export async function searchSupermemory(query: string, apiKey: string): Promise<string> {
    if (!apiKey) return ''
    try {
        const res = await fetch('https://api.supermemory.ai/v3/search', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, limit: 3 })
        })
        const data: any = await res.json()
        return data.results?.map((r: any) => r.content).join('\n---\n') || ''
    } catch { return '' }
}
