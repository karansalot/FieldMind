export async function saveToSupermemory(data: {
    machine_model: string; serial_number: string; overall_status: string
    risk_score: number; nogo_items: string[]; caution_items: string[]
    smu_hours: number; report_number: string; inspection_id: string
}, apiKey: string): Promise<void> {
    if (!apiKey) return
    const content = [
        `FieldMind Inspection Record`,
        `Machine: Cat® ${data.machine_model} | Serial: ${data.serial_number || 'N/A'}`,
        `Report: ${data.report_number} | SMU: ${data.smu_hours}h`,
        `Date: ${new Date().toISOString()}`,
        `Status: ${data.overall_status} | Risk: ${data.risk_score}/100`,
        data.nogo_items.length ? `NO-GO: ${data.nogo_items.join(', ')}` : '',
        data.caution_items.length ? `MONITOR: ${data.caution_items.join(', ')}` : ''
    ].filter(Boolean).join('\n')

    await fetch('https://api.supermemory.ai/v3/memories', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content,
            metadata: { machine_model: data.machine_model, serial_number: data.serial_number, overall_status: data.overall_status, inspection_id: data.inspection_id, type: 'fieldmind_inspection' }
        })
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
        const data = await res.json() as any
        return data.results?.map((r: any) => r.content).join('\n---\n') || ''
    } catch (e) { return '' }
}
