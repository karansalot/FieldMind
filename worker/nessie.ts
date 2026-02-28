export async function trackNessieExpense(data: { inspection_id: string; machine_model: string; status: string; risk_score: number }, apiKey: string): Promise<void> {
    if (!apiKey) return
    const costMap: Record<string, number> = { 'NO-GO': 240000, 'CAUTION': 45000 }
    const amount = costMap[data.status] || 0
    if (!amount) return
    try {
        const merchant = await fetch(`http://api.nessieisreal.com/merchants?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'FieldMind Equipment Service', category: 'Equipment Maintenance', address: { street_number: '100', street_name: 'Caterpillar Way', city: 'Peoria', state: 'IL', zip: '61629' } })
        })
        const m: any = await merchant.json()
        const merchantId = m.objectCreated?._id
        if (merchantId) {
            await fetch(`http://api.nessieisreal.com/accounts/DEMO_ACCOUNT/purchases?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merchant_id: merchantId, medium: 'balance', purchase_date: new Date().toISOString().split('T')[0], amount, description: `FieldMind: ${data.machine_model} ${data.status}` })
            })
        }
    } catch { /* non-critical */ }
}
