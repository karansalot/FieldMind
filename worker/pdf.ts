// PDF generation matching the official Cat® Inspect report format
// Reference: inspection_report_W8210127_20250628.pdf

export async function generatePDF(data: any): Promise<ArrayBuffer> {
    // We use a minimal PDF builder since jsPDF doesn't run in CF Workers natively
    // This generates a standards-compliant PDF using raw PDF syntax

    const lang = data.language || 'en'
    const isSpanish = lang === 'es'

    const statusColors: Record<string, string> = {
        'GO': '0.133 0.769 0.369',      // green #22c55e
        'CAUTION': '0.961 0.620 0.043', // amber #F59E0B
        'NO-GO': '0.937 0.267 0.267',   // red #EF4444
        'PASS': '0.133 0.769 0.369',
        'MONITOR': '0.961 0.620 0.043',
        'FAIL': '0.937 0.267 0.267'
    }

    const catStatusLabel: Record<string, string> = {
        'GO': 'PASS', 'CAUTION': 'MONITOR', 'NO-GO': 'FAIL',
        'PASS': 'PASS', 'MONITOR': 'MONITOR', 'FAIL': 'FAIL'
    }

    const overallStatus = data.overall_status || 'PENDING'
    const catStatus = catStatusLabel[overallStatus] || overallStatus

    const completedDate = data.completed_at
        ? new Date(data.completed_at).toLocaleString('en-US')
        : new Date().toLocaleString('en-US')

    const generatedDate = new Date().toLocaleString('en-US')

    const items = data.items || []

    // Count by CAT status
    const passCount = items.filter((i: any) => i.cat_status === 'PASS' || i.status === 'GO').length
    const monitorCount = items.filter((i: any) => i.cat_status === 'MONITOR' || i.status === 'CAUTION').length
    const failCount = items.filter((i: any) => i.cat_status === 'FAIL' || i.status === 'NO-GO').length

    // Build item rows
    const itemRows = items.map((item: any) => {
        const itemStatus = item.cat_status || (item.status === 'GO' ? 'PASS' : item.status === 'NO-GO' ? 'FAIL' : 'MONITOR')
        const statusDot = itemStatus === 'PASS' ? '● ' : itemStatus === 'FAIL' ? '● ' : '● '
        return `${item.item_number || ''} ${item.item_name}: ${itemStatus}${item.rationale ? '\n   Comments: ' + item.rationale : ''}`
    }).join('\n')

    // Get FAIL/MONITOR items for recommendations
    const criticalItems = items.filter((i: any) => i.cat_status === 'FAIL' || i.status === 'NO-GO')
    const monitorItems = items.filter((i: any) => i.cat_status === 'MONITOR' || i.status === 'CAUTION')

    // Build parts table
    const allParts: any[] = []
    items.forEach((item: any) => {
        try {
            const parts = JSON.parse(item.parts_needed || '[]')
            parts.forEach((p: any) => allParts.push({ ...p, item_name: item.item_name }))
        } catch (e) { }
    })

    const solanaSection = data.solana_verified
        ? `BLOCKCHAIN VERIFIED
Network: Solana Devnet
Transaction: ${data.solana_signature}
Verified: ${data.solana_verified_at}
Explorer: https://explorer.solana.com/tx/${data.solana_signature}?cluster=devnet`
        : `Report Hash: ${data.report_hash || 'Pending verification'}
Blockchain: Not yet anchored to Solana`

    // Build QR code URL
    const verifyUrl = `https://fieldmind.tech/verify/${data.solana_signature || data.report_hash || data.id}`

    // Title translations
    const title = isSpanish ? 'REPORTE DE INSPECCIÓN CAT®' : 'CAT® INSPECTION REPORT'
    const subtitle = isSpanish ? 'Cargadora de Ruedas: Seguridad y Mantenimiento - Revisión Diaria' : 'Wheel Loader: Safety & Maintenance - Daily Walk Around'

    const pdf = buildPDF({
        title: 'FieldMind — Cat® Inspect Standard Report',
        content: `${title}
${subtitle}

Inspection No: ${data.inspection_number || data.report_number}    Customer No: ${data.customer_number || 'N/A'}
Serial Number: ${data.serial_number || 'N/A'}    Customer Name: ${data.customer_name || 'N/A'}
Make: CATERPILLAR    Work Order: ${data.work_order || 'N/A'}
Model: ${data.machine_model}    Completed On: ${completedDate}
Equipment Family: ${data.machine_type || 'N/A'}    Inspector: ${data.inspector_name || 'N/A'}
Asset ID: ${data.asset_id || 'N/A'}    PDF Generated: ${generatedDate}
SMU: ${data.smu_hours || 0} Hours    Location: ${data.site_name || 'N/A'}

OVERALL STATUS: ${catStatus}
● PASS: ${passCount}  ● MONITOR: ${monitorCount}  ● FAIL: ${failCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSPECTION FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itemRows || 'No items recorded.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FINDINGS — IMMEDIATE ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${criticalItems.length > 0
                ? criticalItems.map((i: any, idx: number) => `${idx + 1}. ${i.item_name}: ${i.rationale || 'Immediate repair required'}\n   Action: ${i.recommended_action || 'Do not operate'}`).join('\n')
                : 'No critical findings.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONITOR ITEMS — SCHEDULE WITHIN 30 DAYS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${monitorItems.length > 0
                ? monitorItems.map((i: any, idx: number) => `${idx + 1}. ${i.item_name}: ${i.rationale || 'Schedule service'}`).join('\n')
                : 'No monitor items.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTS REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${allParts.length > 0
                ? allParts.map((p: any) => `Part No: ${p.part_number}  Name: ${p.part_name}  Qty: ${p.quantity}  Urgency: ${p.urgency}  Est: ${p.price_estimate || 'N/A'}`).join('\n')
                : 'No parts required.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${solanaSection}

Scan QR to verify: ${verifyUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Inspector Signature: ___________________________ Date: __________

Supervisor Signature: __________________________ Date: __________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FieldMind | fieldmind.tech | Powered by AI
HackIllinois 2026 | Caterpillar Track
Report: ${data.report_number}  |  Serial: ${data.serial_number || 'N/A'}
`
    })

    return pdf
}

// Minimal standards-compliant PDF builder (no external deps needed in CF Workers)
function buildPDF({ title, content }: { title: string; content: string }): ArrayBuffer {
    const lines = content.split('\n')

    let stream = ''
    let yPos = 750
    const pageHeight = 800
    const lineHeight = 14
    const marginLeft = 50
    let pages: string[] = []
    let currentPageStream = 'BT\n/F1 9 Tf\n'

    for (const line of lines) {
        if (yPos < 80) {
            currentPageStream += 'ET\n'
            pages.push(currentPageStream)
            currentPageStream = 'BT\n/F1 9 Tf\n'
            yPos = 750
        }

        const escaped = line
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')

        let fontSize = 9
        let isBold = false

        if (line.includes('CAT® INSPECTION REPORT') || line.includes('REPORTE DE INSPECCIÓN')) {
            fontSize = 18
            isBold = true
        } else if (line.startsWith('━━━') || line.includes('OVERALL STATUS:') || line.includes('CRITICAL FINDINGS') || line.includes('MONITOR ITEMS') || line.includes('PARTS REQUIRED') || line.includes('VERIFICATION')) {
            fontSize = 10
            isBold = true
        } else if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
            fontSize = 9
        }

        const fontTag = isBold ? '/F2' : '/F1'
        currentPageStream += `${fontTag} ${fontSize} Tf\n`
        currentPageStream += `${marginLeft} ${yPos} Td (${escaped}) Tj\n`
        currentPageStream += `${-marginLeft} -${lineHeight} Td\n`
        yPos -= lineHeight
    }

    currentPageStream += 'ET\n'
    pages.push(currentPageStream)

    // Build PDF structure
    let pdf = '%PDF-1.4\n'
    const objects: string[] = []
    const offsets: number[] = []
    let offset = pdf.length

    // Object 1: Catalog
    let obj = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
    offsets.push(offset); offset += obj.length; objects.push(obj)

    // Object 2: Pages
    obj = `2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`
    offsets.push(offset); offset += obj.length; objects.push(obj)

    // Font objects (shared)
    const fontObjIdx = 3 + pages.length * 2
    const f1Obj = `${fontObjIdx} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
    const f2Obj = `${fontObjIdx + 1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`

    // Page + stream objects
    for (let i = 0; i < pages.length; i++) {
        const streamContent = pages[i]
        const streamObj = `${4 + i * 2} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
        const pageObj = `${3 + i * 2} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${4 + i * 2} 0 R /Resources << /Font << /F1 ${fontObjIdx} 0 R /F2 ${fontObjIdx + 1} 0 R >> >> >>\nendobj\n`
        offsets.push(offset); offset += pageObj.length; objects.push(pageObj)
        offsets.push(offset); offset += streamObj.length; objects.push(streamObj)
    }

    offsets.push(offset); offset += f1Obj.length; objects.push(f1Obj)
    offsets.push(offset); offset += f2Obj.length; objects.push(f2Obj)

    let body = objects.join('')
    const xrefOffset = pdf.length + body.length

    const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => String(pdf.length + o).padStart(10, '0') + ' 00000 n ').join('\n')}\n`
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

    const fullPdf = pdf + body + xref + trailer
    const encoder = new TextEncoder()
    return encoder.encode(fullPdf).buffer
}
