import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { CAT_MACHINES, INSPECTION_SECTIONS, STATUS_CONFIG } from '../lib/cat-knowledge'

export async function generatePDF(reportData: any): Promise<ArrayBuffer> {
    // jsPDF instantiation
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'letter'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Helper functions
    const addHeader = (title: string) => {
        doc.setFillColor(6, 8, 16) // #060810
        doc.rect(0, 0, pageWidth, 80, 'F')
        doc.setFontSize(24)
        doc.setTextColor(240, 165, 0) // #F0A500
        doc.text('FIELDMIND', 40, 48)

        doc.setFontSize(14)
        doc.setTextColor(255, 255, 255)
        doc.text(title, pageWidth - 40, 48, { align: 'right' })
    }

    const addFooter = (page: number) => {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text(`FieldMind | fieldmind.tech | Page ${page}`, pageWidth / 2, pageHeight - 30, { align: 'center' })
    }

    // --- PAGE 1: Overview ---
    addHeader('Cat® Inspect Standard Report')

    // Metadata
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)

    let y = 140
    const meta = [
        `Report No: ${reportData.report_number}`,
        `Asset: ${reportData.machine_brand} ${reportData.machine_model} (${reportData.machine_type})`,
        `Serial: ${reportData.serial_number}`,
        `SMU / Hours: ${reportData.smu_hours}`,
        `Site: ${reportData.site_name}`,
        `Inspector: ${reportData.inspector_name}`,
        `Date: ${new Date(reportData.created_at).toLocaleDateString()}`
    ]

    doc.setFontSize(14)
    doc.text('Inspection Overview', 40, 110)

    doc.setFontSize(12)
    meta.forEach(m => {
        doc.text(m, 40, y)
        y += 20
    })

    // Big Status Box
    const statusMap: Record<string, any> = {
        'GO': { label: 'GO', c: [34, 197, 94] },
        'CAUTION': { label: 'CAUTION', c: [245, 158, 11] },
        'NO-GO': { label: 'NO-GO', c: [239, 68, 68] },
        'pending': { label: 'PENDING', c: [150, 150, 150] }
    }
    const color = statusMap[reportData.overall_status || 'pending'].c
    doc.setFillColor(color[0], color[1], color[2])
    doc.rect(300, 100, 260, 100, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text('OVERALL STATUS', 430, 130, { align: 'center' })
    doc.setFontSize(36)
    doc.text(statusMap[reportData.overall_status || 'pending'].label, 430, 170, { align: 'center' })

    // Summary counts
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text(`GO: ${reportData.go_count}  |  CAUTION: ${reportData.caution_count}  |  NO-GO: ${reportData.nogo_count}`, 430, 230, { align: 'center' })

    addFooter(1)

    // --- PAGE 2: Components Table ---
    doc.addPage()
    addHeader('Inspection Details')

    y = 120
    doc.setFontSize(11)
    doc.setTextColor(150, 150, 150)
    doc.text('#', 40, y)
    doc.text('Component', 70, y)
    doc.text('Status', 250, y)
    doc.text('Finding', 330, y)

    doc.setDrawColor(200, 200, 200)
    doc.line(40, y + 10, pageWidth - 40, y + 10)

    y += 30
    doc.setTextColor(0, 0, 0)

    const comps = reportData.components || []
    comps.forEach((c: any, i: number) => {
        if (y > pageHeight - 80) {
            addFooter(doc.internal.pages.length - 1)
            doc.addPage()
            addHeader('Inspection Details (Cont.)')
            y = 120
        }

        doc.setTextColor(0, 0, 0)
        doc.text(`${i + 1}`, 40, y)

        const cName = doc.splitTextToSize(c.component_name || '', 160)
        doc.text(cName, 70, y)

        const sColor = statusMap[c.status || 'pending'].c
        doc.setTextColor(sColor[0], sColor[1], sColor[2])
        doc.text(c.status || 'PENDING', 250, y)

        doc.setTextColor(0, 0, 0)
        let findingText = c.finding || c.finding_translated || 'No findings reported.'
        if (findingText.length > 80) findingText = findingText.substring(0, 77) + '...'
        const fName = doc.splitTextToSize(findingText, 230)
        doc.text(fName, 330, y)

        const heightNeeded = Math.max(cName.length, fName.length) * 14
        y += heightNeeded + 10
        doc.line(40, y - 5, pageWidth - 40, y - 5)
    })
    addFooter(doc.internal.pages.length - 1)

    // --- PAGE 3: Recommendations & Parts ---
    doc.addPage()
    addHeader('Recommendations & Parts')

    y = 120
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Required Actions', 40, y)
    y += 30

    let partsNeeded: any[] = []
    comps.filter((c: any) => c.status !== 'GO').forEach((c: any) => {
        if (c.parts_needed) {
            try {
                const parsed = JSON.parse(c.parts_needed)
                if (Array.isArray(parsed)) partsNeeded.push(...parsed)
            } catch (e) { }
        }
    })

    doc.setFontSize(12)
    const nogoComps = comps.filter((c: any) => c.status === 'NO-GO')
    const cautionComps = comps.filter((c: any) => c.status === 'CAUTION')

    if (nogoComps.length > 0) {
        doc.setTextColor(239, 68, 68)
        doc.text('CRITICAL / NO-GO FINDINGS:', 40, y)
        y += 20
        doc.setTextColor(0, 0, 0)
        nogoComps.forEach((c: any) => {
            doc.text(`- ${c.component_name}: ${c.finding}`, 50, y)
            y += 20
        })
        y += 10
    }

    if (cautionComps.length > 0) {
        doc.setTextColor(245, 158, 11)
        doc.text('MONITOR / CAUTION FINDINGS:', 40, y)
        y += 20
        doc.setTextColor(0, 0, 0)
        cautionComps.forEach((c: any) => {
            doc.text(`- ${c.component_name}: ${c.finding}`, 50, y)
            y += 20
        })
        y += 10
    }

    if (partsNeeded.length > 0) {
        y += 20
        doc.setFontSize(16)
        doc.text('Parts Needed', 40, y)
        y += 30
        doc.setFontSize(11)
        doc.setTextColor(150, 150, 150)
        doc.text('Part Number', 40, y)
        doc.text('Description', 150, y)
        doc.text('Quantity', 450, y)
        y += 20
        doc.setTextColor(0, 0, 0)
        partsNeeded.forEach(p => {
            doc.text(p.part_number || 'N/A', 40, y)
            doc.text(p.part_name || 'N/A', 150, y)
            doc.text(String(p.quantity || 1), 450, y)
            y += 20
        })
    }

    addFooter(doc.internal.pages.length - 1)

    // --- PAGE 4: Signatures & Blockchain ---
    doc.addPage()
    addHeader('Verification & Sign-Off')

    y = 120
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Signatures', 40, y)

    y += 100
    doc.line(40, y, 250, y)
    doc.line(300, y, 510, y)
    y += 20
    doc.setFontSize(12)
    doc.text(`${reportData.inspector_name || 'Inspector'}`, 40, y)
    doc.text('Supervisor signature', 300, y)

    if (reportData.solana_signature) {
        y += 80
        doc.setFontSize(14)
        doc.setTextColor(153, 69, 255) // #9945FF
        doc.text('Blockchain Verified', 40, y)
        y += 20
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.text(`Network: Solana Devnet`, 40, y)
        y += 15
        doc.text(`Signature: ${reportData.solana_signature}`, 40, y)
        y += 15
        doc.text(`Verified At: ${new Date(reportData.solana_verified_at).toLocaleString()}`, 40, y)

        try {
            const qrUrl = await QRCode.toDataURL(`https://fieldmind.tech/verify/${reportData.solana_signature}`)
            doc.addImage(qrUrl, 'PNG', 400, y - 50, 100, 100)
        } catch (e) { }
    }

    addFooter(doc.internal.pages.length - 1)

    return doc.output('arraybuffer')
}
