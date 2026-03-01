export async function trackNessieExpense(data: {
    inspection_id: string; machine_model: string; status: string; risk_score: number
}, apiKey: string): Promise<string | null> {
    if (!apiKey) return null
    const costMap: Record<string, number> = { 'NO-GO': 240000, 'CAUTION': 45000 }
    const amount = costMap[data.status]
    if (!amount) return null
    try {
        // Create merchant
        const merchantRes = await fetch(`http://api.nessieisreal.com/merchants?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'FieldMind Equipment Service',
                category: 'Equipment Maintenance',
                address: { street_number: '100', street_name: 'Caterpillar Way', city: 'Peoria', state: 'IL', zip: '61629' }
            })
        })
        const merchant = await merchantRes.json() as any
        const merchantId = merchant.objectCreated?._id
        if (!merchantId) return null

        // Get first account
        const accountsRes = await fetch(`http://api.nessieisreal.com/accounts?key=${apiKey}`)
        const accountsData = await accountsRes.json() as any
        const accounts = Array.isArray(accountsData) ? accountsData : accountsData?.data || []
        const accountId = accounts[0]?._id || accounts[0]?.id
        if (!accountId) return null

        // Create purchase
        const purchaseRes = await fetch(`http://api.nessieisreal.com/accounts/${accountId}/purchases?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                merchant_id: merchantId,
                medium: 'balance',
                purchase_date: new Date().toISOString().split('T')[0],
                amount,
                description: `FieldMind: Cat® ${data.machine_model} ${data.status} | Risk ${data.risk_score}/100 | ID: ${data.inspection_id.slice(0, 8)}`
            })
        })
        const purchase = await purchaseRes.json() as any
        return purchase.objectCreated?._id || null
    } catch (e) {
        console.error('Nessie error:', e)
        return null
    }
}
