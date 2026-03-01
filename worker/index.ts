import { verifyOnSolana } from './solana'
import { generatePDF } from './pdf'
import { callElevenLabs } from './elevenlabs'
import { saveToSupermemory, searchSupermemory } from './supermemory'
import { trackNessieExpense } from './nessie'

export interface Env {
    DB: D1Database
    STORAGE: R2Bucket
    KV: KVNamespace
    OPENAI_API_KEY: string
    ELEVENLABS_API_KEY: string
    SUPERMEMORY_API_KEY: string
    NESSIE_API_KEY: string
    SOLANA_PRIVATE_KEY: string
    APP_URL: string
    ACCOUNT_ID: string
}

const ALLOWED_ORIGINS = [
    'https://fieldmind.tech',
    'https://www.fieldmind.tech',
    'http://localhost:3000',
    'http://localhost:3001'
]

function cors(response: Response, origin: string): Response {
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    const headers = new Headers(response.headers)
    headers.set('Access-Control-Allow-Origin', allowed)
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Device-ID')
    headers.set('Vary', 'Origin')
    return new Response(response.body, { status: response.status, headers })
}

function json(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    })
}

function err(status: number, code: string, message: string): Response {
    return json({ error: { code, message }, request_id: `req_${Date.now()}` }, status)
}

function generateId(): string { return crypto.randomUUID() }

function generateReportNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `FM-${date}-${num}`
}

// Rate limiting via KV token bucket
async function checkRateLimit(kv: KVNamespace, deviceId: string, endpoint: string, limit = 20): Promise<boolean> {
    const key = `rl:${endpoint}:${deviceId}`
    const current = await kv.get(key)
    const count = current ? parseInt(current) : 0
    if (count >= limit) return false
    await kv.put(key, String(count + 1), { expirationTtl: 3600 })
    return true
}

// Map PASS/MONITOR/FAIL to GO/CAUTION/NO-GO
function catStatusToFieldMind(catStatus: string): string {
    const map: Record<string, string> = {
        'PASS': 'GO', 'NORMAL': 'GO',
        'MONITOR': 'CAUTION',
        'FAIL': 'NO-GO'
    }
    return map[catStatus?.toUpperCase()] || 'CAUTION'
}

function fieldMindToCatStatus(status: string): string {
    const map: Record<string, string> = {
        'GO': 'PASS', 'CAUTION': 'MONITOR', 'NO-GO': 'FAIL'
    }
    return map[status] || 'MONITOR'
}

// CAT standard inspection checklist
const CAT_CHECKLIST = [
    {
        section: '1', name: 'From the Ground', name_es: 'Desde el Suelo',
        items: [
            { num: '1.1', name: 'Tires and Rims', name_es: 'Llantas y Rines' },
            { num: '1.2', name: 'Bucket Cutting Edge, Tips, or Moldboard', name_es: 'Filo de Corte del Cucharón' },
            { num: '1.3', name: 'Bucket Tilt Cylinders and Hoses', name_es: 'Cilindros de Inclinación y Mangueras' },
            { num: '1.4', name: 'Bucket, Lift Cylinders and Hoses', name_es: 'Cilindros de Elevación y Mangueras' },
            { num: '1.5', name: 'Lift arm attachment to frame', name_es: 'Unión del Brazo al Bastidor' },
            { num: '1.6', name: 'Underneath of Machine', name_es: 'Parte Inferior de la Máquina' },
            { num: '1.7', name: 'Transmission and Transfer Gears', name_es: 'Transmisión y Engranajes de Transferencia' },
            { num: '1.8', name: 'Differential and Final Drive Oil', name_es: 'Aceite Diferencial y Mando Final' },
            { num: '1.9', name: 'Steps and Handrails', name_es: 'Escalones y Pasamanos' },
            { num: '1.10', name: 'Brake Air Tank', name_es: 'Tanque de Aire de Frenos' },
            { num: '1.11', name: 'Fuel Tank', name_es: 'Tanque de Combustible' },
            { num: '1.12', name: 'Axles - Final Drives, Differentials, Brakes, Duo-cone Seals', name_es: 'Ejes - Mandos Finales, Diferenciales' },
            { num: '1.13', name: 'Hydraulic fluid tank', name_es: 'Tanque de Fluido Hidráulico' },
            { num: '1.14', name: 'Transmission Oil', name_es: 'Aceite de Transmisión' },
            { num: '1.15', name: 'Work Lights', name_es: 'Luces de Trabajo' },
            { num: '1.16', name: 'Battery & Cables', name_es: 'Batería y Cables' }
        ]
    },
    {
        section: '2', name: 'Engine Compartment', name_es: 'Compartimento del Motor',
        items: [
            { num: '2.1', name: 'Engine Oil Level', name_es: 'Nivel de Aceite del Motor' },
            { num: '2.2', name: 'Engine Coolant Level', name_es: 'Nivel de Refrigerante' },
            { num: '2.3', name: 'Check Radiator Cores for Debris', name_es: 'Verificar Núcleos del Radiador' },
            { num: '2.4', name: 'Inspect Hoses for Cracks or Leaks', name_es: 'Inspeccionar Mangueras' },
            { num: '2.5', name: 'Primary/secondary fuel filters', name_es: 'Filtros de Combustible Primario/Secundario' },
            { num: '2.6', name: 'All Belts', name_es: 'Todas las Correas' },
            { num: '2.7', name: 'Air Cleaner and Air Filter Service Indicator', name_es: 'Filtro de Aire e Indicador' },
            { num: '2.8', name: 'Overall Engine Compartment', name_es: 'Compartimento del Motor en General' }
        ]
    },
    {
        section: '3', name: 'On the Machine, Outside the Cab', name_es: 'En la Máquina, Exterior de la Cabina',
        items: [
            { num: '3.1', name: 'Steps & Handrails', name_es: 'Escalones y Pasamanos' },
            { num: '3.2', name: 'ROPS/FOPS', name_es: 'ROPS/FOPS' },
            { num: '3.3', name: 'Fire Extinguisher', name_es: 'Extintor de Incendios' },
            { num: '3.4', name: 'Windshield wipers and washers', name_es: 'Limpiaparabrisas' },
            { num: '3.5', name: 'Side Doors', name_es: 'Puertas Laterales' }
        ]
    },
    {
        section: '4', name: 'Inside the Cab', name_es: 'Interior de la Cabina',
        items: [
            { num: '4.1', name: 'Seat', name_es: 'Asiento' },
            { num: '4.2', name: 'Seat belt and mounting', name_es: 'Cinturón de Seguridad y Montaje' },
            { num: '4.3', name: 'Horn', name_es: 'Bocina' },
            { num: '4.4', name: 'Backup Alarm', name_es: 'Alarma de Retroceso' },
            { num: '4.5', name: 'Windows and Mirrors', name_es: 'Ventanas y Espejos' },
            { num: '4.6', name: 'Cab Air Filter', name_es: 'Filtro de Aire de Cabina' },
            { num: '4.7', name: 'Indicators & Gauges', name_es: 'Indicadores y Medidores' },
            { num: '4.8', name: 'Switch functionality', name_es: 'Funcionalidad de Interruptores' },
            { num: '4.9', name: 'Overall Cab Interior', name_es: 'Interior General de la Cabina' }
        ]
    }
]

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const origin = request.headers.get('Origin') || ''

        if (request.method === 'OPTIONS') {
            return cors(new Response(null, { status: 204 }), origin)
        }

        const url = new URL(request.url)
        const path = url.pathname
        const method = request.method
        const deviceId = request.headers.get('X-Device-ID') || 'anonymous'

        const respond = (data: any, status = 200) => cors(json(data, status), origin)
        const respondErr = (status: number, code: string, msg: string) => cors(err(status, code, msg), origin)

        try {

            // ── GET /api/health ──────────────────────────────────────────────
            if (method === 'GET' && path === '/api/health') {
                const dbOk = await env.DB.prepare('SELECT 1').first().then(() => true).catch(() => false)
                return respond({
                    status: 'ok',
                    app: 'FieldMind API',
                    version: '2.0.0',
                    timestamp: new Date().toISOString(),
                    features: {
                        openai: !!env.OPENAI_API_KEY,
                        elevenlabs: !!env.ELEVENLABS_API_KEY,
                        solana: !!env.SOLANA_PRIVATE_KEY,
                        nessie: !!env.NESSIE_API_KEY,
                        supermemory: !!env.SUPERMEMORY_API_KEY,
                    },
                    db: dbOk
                })
            }

            // ── GET /api/weather ─────────────────────────────────────────────
            if (method === 'GET' && path === '/api/weather') {
                const lat = url.searchParams.get('lat')
                const lon = url.searchParams.get('lon')
                const zip = url.searchParams.get('zip')
                const cacheKey = `weather:${lat || zip || 'default'}`

                const cached = await env.KV.get(cacheKey, 'json')
                if (cached) return respond(cached)

                const location = lat && lon ? `${lat},${lon}` : zip || 'auto'
                const wttrRes = await fetch(`https://wttr.in/${location}?format=j1`)
                const wttr = await wttrRes.json() as any

                const current = wttr?.current_condition?.[0]
                const tempF = parseInt(current?.temp_F || '60')
                const tempC = parseInt(current?.temp_C || '15')
                const condition = current?.weatherDesc?.[0]?.value || 'Clear'
                const windMph = parseInt(current?.windspeedMiles || '0')
                const humidity = parseInt(current?.humidity || '50')

                const weatherData = {
                    temp_f: tempF,
                    temp_c: tempC,
                    condition: condition.toLowerCase(),
                    wind_mph: windMph,
                    humidity,
                    is_freezing: tempF <= 32,
                    is_cold: tempF <= 40,
                    is_hot: tempF >= 95,
                    is_rainy: condition.toLowerCase().includes('rain'),
                    is_snowy: condition.toLowerCase().includes('snow'),
                    is_windy: windMph > 25,
                    protocol: tempF <= 32 ? 'cold' : tempF >= 95 ? 'hot' :
                        condition.toLowerCase().includes('rain') ? 'wet' : 'normal',
                    advice: tempF <= 32
                        ? 'Cold weather protocol active. Seals brittle — inspect hydraulic hoses with extra care.'
                        : tempF >= 95
                            ? 'Heat advisory. Check coolant levels first. Hydraulic overheating risk.'
                            : condition.toLowerCase().includes('rain')
                                ? 'Wet conditions. Check slip hazards. Extra attention to electrical connections.'
                                : 'Normal conditions.'
                }

                await env.KV.put(cacheKey, JSON.stringify(weatherData), { expirationTtl: 1800 })
                return respond(weatherData)
            }

            // ── GET /api/checklist ───────────────────────────────────────────
            if (method === 'GET' && path === '/api/checklist') {
                const lang = url.searchParams.get('lang') || 'en'
                return respond({
                    sections: CAT_CHECKLIST,
                    total_items: CAT_CHECKLIST.reduce((sum, s) => sum + s.items.length, 0)
                })
            }

            // ── POST /api/inspections ────────────────────────────────────────
            if (method === 'POST' && path === '/api/inspections') {
                const body = await request.json() as any
                if (!body.machine_type || !body.machine_model) {
                    return respondErr(400, 'validation_error', 'machine_type and machine_model required')
                }
                const id = generateId()
                const report_number = generateReportNumber()
                const inspection_number = Math.floor(Math.random() * 90000000 + 10000000).toString()
                const now = new Date().toISOString()

                await env.DB.prepare(`
          INSERT INTO inspections (
            id, report_number, inspection_number, machine_type, machine_model,
            serial_number, asset_id, customer_name, customer_number, work_order,
            site_name, site_address, inspector_name, smu_hours,
            language, weather_temp, weather_condition, mode, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
                    id, report_number, inspection_number,
                    body.machine_type, body.machine_model,
                    body.serial_number || '',
                    body.asset_id || '',
                    body.customer_name || '',
                    body.customer_number || '',
                    body.work_order || '',
                    body.site_name || '',
                    body.site_address || '',
                    body.inspector_name || '',
                    body.smu_hours || 0,
                    body.language || 'en',
                    body.weather_temp || null,
                    body.weather_condition || '',
                    body.mode || 'full',
                    now
                ).run()

                return respond({ id, report_number, inspection_number, status: 'pending', created_at: now }, 201)
            }

            // ── GET /api/inspections ─────────────────────────────────────────
            if (method === 'GET' && path === '/api/inspections') {
                const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
                const status = url.searchParams.get('status')
                const machine = url.searchParams.get('machine')

                let query = 'SELECT * FROM inspections'
                const conditions: string[] = []
                const params: any[] = []

                if (status) { conditions.push('overall_status=?'); params.push(status) }
                if (machine) { conditions.push('machine_model=?'); params.push(machine) }
                if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
                query += ' ORDER BY created_at DESC LIMIT ?'
                params.push(limit)

                const rows = await env.DB.prepare(query).bind(...params).all()
                return respond({ data: rows.results, total: rows.results.length })
            }

            // ── GET /api/inspections/:id ─────────────────────────────────────
            const inspMatch = path.match(/^\/api\/inspections\/([^/]+)$/)
            if (method === 'GET' && inspMatch) {
                const id = inspMatch[1]
                const row = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first()
                if (!row) return respondErr(404, 'not_found', 'Inspection not found')
                const items = await env.DB.prepare(
                    'SELECT * FROM inspection_items WHERE inspection_id=? ORDER BY section_number, item_number'
                ).bind(id).all()
                return respond({ ...row, items: items.results })
            }

            // ── POST /api/inspections/:id/items ─────────────────────────────
            const itemsMatch = path.match(/^\/api\/inspections\/([^/]+)\/items$/)
            if (method === 'POST' && itemsMatch) {
                const inspId = itemsMatch[1]
                const body = await request.json() as any

                if (!body.item_name || !body.section_number) {
                    return respondErr(400, 'validation_error', 'item_name and section_number required')
                }

                // Rate limit AI calls
                if (body.image_base64 || body.voice_note) {
                    const allowed = await checkRateLimit(env.KV, deviceId, 'analyze', 30)
                    if (!allowed) return respondErr(429, 'rate_limited', 'Too many AI requests. Try again in 1 hour.')
                }

                const insp = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(inspId).first() as any
                if (!insp) return respondErr(404, 'not_found', 'Inspection not found')

                const lang = insp.language || 'en'

                // Get machine history from Supermemory
                let machineHistory = ''
                if (env.SUPERMEMORY_API_KEY && insp.serial_number) {
                    try {
                        machineHistory = await searchSupermemory(
                            `${insp.machine_model} ${insp.serial_number}`, env.SUPERMEMORY_API_KEY
                        )
                    } catch (e) { }
                }

                const weatherCtx = insp.weather_temp
                    ? `${insp.weather_temp}°F, ${insp.weather_condition}`
                    : 'Unknown'

                const langInstructions: Record<string, string> = {
                    en: 'Respond in English.',
                    es: 'Responde completamente en español. Terminología de construcción CAT. Números de parte en inglés (ej: 1R-0750).',
                    pt: 'Responda completamente em português.',
                    fr: 'Répondez entièrement en français.',
                    zh: '用中文回复。'
                }

                const systemPrompt = `You are a CAT® certified inspection AI following Cat® Inspect standards and advanced HackIL26-CATrack anomaly detection guidelines.

LANGUAGE: ${langInstructions[lang] || langInstructions.en}

MACHINE: Cat® ${insp.machine_model} | Serial: ${insp.serial_number || 'N/A'} | SMU: ${insp.smu_hours}h
WEATHER: ${weatherCtx}

CRITICAL FAIL CONDITIONS (always FAIL status):
- Active hydraulic leak, Structural crack, Missing/damaged ROPS/FOPS, Non-functional backup alarm or brakes, Missing fire extinguisher, Fuel leak

MODULE CONSTRAINED PROMPTING: You are inspecting the module: "${body.item_name}". Only output anomalies relevant to this module. Confirm the primary visible defect.

Return ONLY valid JSON matching this exact structure:
{
  "anomalies":[
    {
      "component_location": "string",
      "component_type": "string",
      "condition_description": "string",
      "safety_impact_assessment": "Critical|Moderate|Low|None",
      "visibility_impact": "string",
      "operational_impact": "string",
      "recommended_action": "string",
      "confidence": 0-1,
      "severity": "RED|YELLOW|GREEN"
    }
  ],
  "summary": "string",
  "risk_score": 0-100,
  "priority": "Immediate|Schedule|Monitor",
  "next_steps": ["string"]
}`

                let aiResult: any = null

                if (env.OPENAI_API_KEY) {
                    const messages: any[] = [{
                        role: 'user',
                        content: body.image_base64
                            ? [
                                { type: 'text', text: `Inspect item ${body.item_number || ''} — ${body.item_name}: ${body.section_name || ''}${body.voice_note ? `\nInspector note: "${body.voice_note}"` : ''}` },
                                {
                                    type: 'image_url', image_url: {
                                        url: body.image_base64.startsWith('data:') ? body.image_base64 : `data:image/jpeg;base64,${body.image_base64}`,
                                        detail: 'high'
                                    }
                                }
                            ]
                            : [{ type: 'text', text: `Inspect item ${body.item_number || ''} — ${body.item_name}${body.voice_note ? `\nInspector note: "${body.voice_note}"` : '\nNo photo — provide guidance based on common failure modes.'}` }]
                    }]

                    if (body.video_frames && body.video_frames.length > 0) {
                        messages[0].content = [
                            { type: 'text', text: `Inspect item ${body.item_number || ''} — ${body.item_name}: ${body.section_name || ''}${body.voice_note ? `\nInspector note: "${body.voice_note}"` : ''}\n\nHere are frames extracted from a video:` },
                            ...body.video_frames.slice(0, 5).map((frame: string) => ({
                                type: 'image_url', image_url: {
                                    url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}`,
                                    detail: 'low'
                                }
                            }))
                        ]
                    }

                    try {
                        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: 'gpt-4o',
                                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                                max_tokens: 1200,
                                response_format: { type: 'json_object' }
                            })
                        })
                        const aiData = await aiResponse.json() as any
                        aiResult = JSON.parse(aiData.choices[0].message.content)
                    } catch (e) {
                        console.error('OpenAI error:', e)
                    }
                }

                // Fallback if no OpenAI or error
                if (!aiResult) {
                    aiResult = {
                        anomalies: [
                            {
                                component_location: body.item_name,
                                component_type: "General",
                                condition_description: body.voice_note || "Analysis unavailable. Manual review required.",
                                safety_impact_assessment: "Moderate",
                                visibility_impact: "None",
                                operational_impact: "Monitor",
                                recommended_action: "Manual inspection",
                                confidence: 0.5,
                                severity: body.manual_status === 'NO-GO' ? 'RED' : body.manual_status === 'CAUTION' ? 'YELLOW' : 'GREEN'
                            }
                        ],
                        summary: "Fallback local transcript result.",
                        risk_score: 50,
                        priority: "Monitor",
                        next_steps: ["Re-verify manually"]
                    }
                }

                // Map schema to fieldmind internal state
                const highestSeverity = aiResult.anomalies?.some((a: any) => a.severity === 'RED') ? 'RED'
                    : aiResult.anomalies?.some((a: any) => a.severity === 'YELLOW') ? 'YELLOW' : 'GREEN'

                const catStatus = highestSeverity === 'RED' ? 'FAIL' : highestSeverity === 'YELLOW' ? 'MONITOR' : 'PASS'
                const fmStatus = highestSeverity === 'RED' ? 'NO-GO' : highestSeverity === 'YELLOW' ? 'CAUTION' : 'GO'
                const mainFinding = aiResult.summary || aiResult.anomalies?.[0]?.condition_description || ''
                const confidenceRaw = aiResult.anomalies?.[0]?.confidence || 0.5
                const confidencePct = confidenceRaw <= 1 ? Math.round(confidenceRaw * 100) : confidenceRaw

                // Save photo to R2 if provided
                let photoR2Key = ''
                if (body.image_base64 && env.STORAGE) {
                    try {
                        const base64Data = body.image_base64.replace(/^data:image\/\w+;base64,/, '')
                        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
                        photoR2Key = `photos/${inspId}/${generateId()}.jpg`
                        await env.STORAGE.put(photoR2Key, imageBuffer, {
                            httpMetadata: { contentType: 'image/jpeg' }
                        })
                        // Save photo record
                        await env.DB.prepare(
                            'INSERT INTO photos (id, inspection_id, r2_key, caption, created_at) VALUES (?,?,?,?,?)'
                        ).bind(generateId(), inspId, photoR2Key, body.item_name || '', new Date().toISOString()).run()
                    } catch (e) { console.error('R2 upload error:', e) }
                }

                const itemId = generateId()
                const now = new Date().toISOString()

                await env.DB.prepare(`
          INSERT INTO inspection_items (
            id, inspection_id, section_number, section_name,
            item_number, item_name, status, cat_status, confidence,
            rationale, recommended_action, severity, has_photo,
            photo_r2_key, voice_note, ai_response, parts_needed, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
                    itemId, inspId,
                    body.section_number || '1',
                    body.section_name || 'General',
                    body.item_number || '1.1',
                    body.item_name,
                    fmStatus, catStatus,
                    confidencePct,
                    mainFinding,
                    aiResult.action?.immediate || '',
                    aiResult.severity || 1,
                    photoR2Key ? 1 : 0,
                    photoR2Key,
                    body.voice_note || '',
                    JSON.stringify(aiResult),
                    JSON.stringify(aiResult.action?.parts_needed || []),
                    now
                ).run()

                // Update inspection counts
                const countField = fmStatus === 'GO' ? 'go_count' : fmStatus === 'NO-GO' ? 'nogo_count' : 'caution_count'
                await env.DB.prepare(`UPDATE inspections SET ${countField}=${countField}+1 WHERE id=?`).bind(inspId).run()

                return respond({
                    id: itemId,
                    inspection_id: inspId,
                    cat_status: catStatus,
                    status: fmStatus,
                    confidence: aiResult.confidence,
                    finding: aiResult.finding,
                    severity: aiResult.severity,
                    details: aiResult.details,
                    action: aiResult.action,
                    proactive: aiResult.proactive,
                    photo_saved: !!photoR2Key
                }, 201)
            }

            // ── POST /api/voice/transcribe ───────────────────────────────────
            if (method === 'POST' && path === '/api/voice/transcribe') {
                const body = await request.json() as any
                const text = body.transcript || ''
                const reqLang = body.language || 'en'

                if (!env.OPENAI_API_KEY) {
                    return respond({ transcript: text, language: reqLang, english: text, spanish: text, is_local: true })
                }
                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'system', content: 'You translate voice notes. Return JSON: {"transcript":"<original>","language":"<detected>","english":"<en translation>","spanish":"<es translation>"}' }, { role: 'user', content: text }],
                        response_format: { type: 'json_object' }
                    })
                })
                const aiData = await aiRes.json() as any
                try { return respond(JSON.parse(aiData.choices[0].message.content)) } catch (e) { }
                return respond({ transcript: text, fallback: true })
            }

            // ── POST /api/inspections/:id/audit ──────────────────────────────
            if (method === 'POST' && path.match(/^\/api\/inspections\/([^/]+)\/audit$/)) {
                const inspId = path.split('/')[3]
                const body = await request.json() as any
                const { item_id, original_finding, new_finding, action_type } = body

                await env.DB.prepare(
                    `INSERT INTO audit_logs (id, inspection_id, item_id, original_finding, new_finding, action_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(generateId(), inspId, item_id || 'general', original_finding, new_finding, action_type || 'manual_correction', new Date().toISOString()).run()

                return respond({ success: true })
            }

            // ── POST /api/inspections/:id/complete ───────────────────────────
            const completeMatch = path.match(/^\/api\/inspections\/([^/]+)\/complete$/)
            if (method === 'POST' && completeMatch) {
                const id = completeMatch[1]
                const insp = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first() as any
                if (!insp) return respondErr(404, 'not_found', 'Inspection not found')

                let overall_status = 'GO'
                let risk_score = 0

                if (insp.nogo_count > 0) {
                    overall_status = 'NO-GO'
                    risk_score = Math.min(100, 50 + (insp.nogo_count * 20) + (insp.caution_count * 5))
                } else if (insp.caution_count > 0) {
                    overall_status = 'CAUTION'
                    risk_score = Math.min(75, insp.caution_count * 15)
                } else {
                    risk_score = Math.max(0, 10 - insp.go_count)
                }

                // Compute report hash
                const hashData = JSON.stringify({ id, overall_status, risk_score, completed_at: new Date().toISOString() })
                const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashData))
                const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

                const now = new Date().toISOString()
                await env.DB.prepare(`
          UPDATE inspections SET overall_status=?, risk_score=?, status='complete', completed_at=?, report_hash=?
          WHERE id=?
        `).bind(overall_status, risk_score, now, hashHex, id).run()

                // Save to Supermemory
                if (env.SUPERMEMORY_API_KEY) {
                    try {
                        const items = await env.DB.prepare('SELECT * FROM inspection_items WHERE inspection_id=?').bind(id).all()
                        const nogoItems = items.results.filter((c: any) => c.status === 'NO-GO').map((c: any) => c.item_name)
                        const cautionItems = items.results.filter((c: any) => c.status === 'CAUTION').map((c: any) => c.item_name)
                        await saveToSupermemory({
                            machine_model: insp.machine_model, serial_number: insp.serial_number,
                            overall_status, risk_score, nogo_items: nogoItems, caution_items: cautionItems,
                            smu_hours: insp.smu_hours, report_number: insp.report_number, inspection_id: id
                        }, env.SUPERMEMORY_API_KEY)
                    } catch (e) { }
                }

                // Track in Nessie
                if (env.NESSIE_API_KEY && overall_status !== 'GO') {
                    try {
                        const nessieRef = await trackNessieExpense({ inspection_id: id, machine_model: insp.machine_model, status: overall_status, risk_score }, env.NESSIE_API_KEY)
                        if (nessieRef) {
                            await env.DB.prepare('UPDATE inspections SET nessie_purchase_id=? WHERE id=?').bind(nessieRef, id).run()
                            await env.DB.prepare('INSERT INTO cost_events (id, inspection_id, vendor, category, amount, currency, nessie_ref, created_at) VALUES (?,?,?,?,?,?,?,?)').bind(
                                generateId(), id, 'FieldMind', 'Equipment Maintenance',
                                overall_status === 'NO-GO' ? 2400 : 450, 'USD', nessieRef, now
                            ).run()
                        }
                    } catch (e) { }
                }

                return respond({
                    id, overall_status, risk_score, report_hash: hashHex,
                    go_count: insp.go_count, caution_count: insp.caution_count, nogo_count: insp.nogo_count, completed_at: now
                })
            }

            // ── POST /api/inspections/:id/anchor-solana ──────────────────────
            const solanaMatch = path.match(/^\/api\/inspections\/([^/]+)\/anchor-solana$/)
            if (method === 'POST' && solanaMatch) {
                const id = solanaMatch[1]
                const insp = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first() as any
                if (!insp) return respondErr(404, 'not_found', 'Inspection not found')

                if (insp.solana_verified) {
                    return respond({
                        signature: insp.solana_signature,
                        explorer_url: `https://explorer.solana.com/tx/${insp.solana_signature}?cluster=devnet`,
                        verified_at: insp.solana_verified_at,
                        already_verified: true
                    })
                }

                if (!env.SOLANA_PRIVATE_KEY) {
                    return respond({
                        signature: null,
                        local_hash: insp.report_hash,
                        verified: false,
                        fallback: true,
                        message: 'Solana key not configured. Local hash verification only.'
                    })
                }

                const result = await verifyOnSolana({
                    id: insp.id, report_number: insp.report_number, machine_model: insp.machine_model,
                    status: insp.overall_status, risk_score: insp.risk_score,
                    nogo_count: insp.nogo_count, caution_count: insp.caution_count,
                    report_hash: insp.report_hash
                }, env.SOLANA_PRIVATE_KEY)

                await env.DB.prepare(`UPDATE inspections SET solana_signature=?, solana_verified=1, solana_verified_at=? WHERE id=?`
                ).bind(result.signature, result.verified_at, id).run()

                return respond(result)
            }

            // ── GET /api/inspections/:id/report ─────────────────────────────
            const reportMatch = path.match(/^\/api\/inspections\/([^/]+)\/report$/)
            if (method === 'GET' && reportMatch) {
                const id = reportMatch[1]
                const format = url.searchParams.get('format') || 'json'
                const insp = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first() as any
                if (!insp) return respondErr(404, 'not_found', 'Inspection not found')

                const items = await env.DB.prepare(
                    'SELECT * FROM inspection_items WHERE inspection_id=? ORDER BY section_number, item_number'
                ).bind(id).all()

                const reportData = { ...insp, items: items.results, checklist: CAT_CHECKLIST }

                if (format === 'pdf') {
                    try {
                        const pdfBytes = await generatePDF(reportData)
                        return cors(new Response(pdfBytes, {
                            headers: {
                                'Content-Type': 'application/pdf',
                                'Content-Disposition': `attachment; filename="${insp.report_number}.pdf"`
                            }
                        }), origin)
                    } catch (e: any) {
                        return respondErr(500, 'pdf_error', e.message || 'PDF generation failed')
                    }
                }

                return respond(reportData)
            }

            // ── POST /api/voice/transcribe-intent ────────────────────────────
            if (method === 'POST' && path === '/api/voice/transcribe-intent') {
                const allowed = await checkRateLimit(env.KV, deviceId, 'voice', 20)
                if (!allowed) return respondErr(429, 'rate_limited', 'Too many voice requests.')

                const body = await request.json() as any
                const text = body.transcript || body.text || ''
                const lang = body.language || 'en'

                if (!env.OPENAI_API_KEY) {
                    return respond({
                        transcript: text,
                        intent: { action: 'unknown', raw: text },
                        fallback: true
                    })
                }

                const intentPrompt = lang === 'es'
                    ? `Analiza este comando de voz y devuelve JSON: "${text}"
{"action":"start_inspection"|"resume_inspection"|"show_hazards"|"read_nogo"|"mark_item"|"complete_inspection"|"identify_part"|"unknown","machine_model":"string or null","item_name":"string or null","status":"PASS|MONITOR|FAIL or null","raw":"${text}"}`
                    : `Parse this voice command and return JSON: "${text}"
{"action":"start_inspection"|"resume_inspection"|"show_hazards"|"read_nogo"|"mark_item"|"complete_inspection"|"identify_part"|"unknown","machine_model":"string or null","item_name":"string or null","status":"PASS|MONITOR|FAIL or null","raw":"${text}"}`

                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            { role: 'system', content: 'You are a voice command parser for CAT equipment inspection. Return only valid JSON.' },
                            { role: 'user', content: intentPrompt }
                        ],
                        max_tokens: 200,
                        response_format: { type: 'json_object' }
                    })
                })
                const aiData = await aiRes.json() as any
                let intent = { action: 'unknown', raw: text }
                try { intent = JSON.parse(aiData.choices[0].message.content) } catch (e) { }

                await env.DB.prepare('INSERT INTO voice_events (id, transcript, intent_json, created_at) VALUES (?,?,?,?)').bind(
                    generateId(), text, JSON.stringify(intent), new Date().toISOString()
                ).run()

                return respond({ transcript: text, intent })
            }

            // ── POST /api/parts/identify ─────────────────────────────────────
            if (method === 'POST' && path === '/api/parts/identify') {
                const allowed = await checkRateLimit(env.KV, deviceId, 'parts', 20)
                if (!allowed) return respondErr(429, 'rate_limited', 'Too many requests.')

                const body = await request.json() as any
                const lang = body.language || 'en'
                const langNote = lang === 'es' ? 'Responde en español. Nombres de piezas en español. Números de parte en inglés.' : ''

                if (!env.OPENAI_API_KEY) {
                    return respond({ parts: [], fallback: true, message: 'AI disabled. Visit parts.cat.com directly.' })
                }

                const messages: any[] = [{
                    role: 'user',
                    content: body.image_base64
                        ? [
                            {
                                type: 'text', text: `Identify this CAT equipment part. ${langNote} Return JSON only with ranked part matches:
{"parts":[{"rank":1,"part_number":"1R-0750","part_name":"Engine Oil Filter","confidence":94,"category":"Filters","fits_models":["320","330"],"price_estimate":"$45-65","order_url":"https://parts.cat.com/en/catcorp","why":"explanation"}]}` },
                            { type: 'image_url', image_url: { url: body.image_base64.startsWith('data:') ? body.image_base64 : `data:image/jpeg;base64,${body.image_base64}`, detail: 'high' } }
                        ]
                        : [{
                            type: 'text', text: `Identify CAT part: "${body.description}". Machine: ${body.machine_model || 'unknown'}. ${langNote}
Return JSON: {"parts":[{"rank":1,"part_number":"","part_name":"","confidence":0,"category":"","fits_models":[],"price_estimate":"","order_url":"https://parts.cat.com/en/catcorp","why":""}]}` }]
                }]

                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [{ role: 'system', content: 'You are a CAT parts identification expert. Return only valid JSON.' }, ...messages],
                        max_tokens: 1000,
                        response_format: { type: 'json_object' }
                    })
                })
                const aiData = await aiRes.json() as any
                let result = { parts: [] }
                try { result = JSON.parse(aiData.choices[0].message.content) } catch (e) { }

                await env.DB.prepare('INSERT INTO parts_searches (id, description, results, language, created_at) VALUES (?,?,?,?,?)').bind(
                    generateId(), body.description || 'image search', JSON.stringify((result as any).parts || []), lang, new Date().toISOString()
                ).run()

                return respond(result)
            }

            // ── POST /api/tts ────────────────────────────────────────────────
            if (method === 'POST' && path === '/api/tts') {
                const body = await request.json() as any
                if (!env.ELEVENLABS_API_KEY) {
                    return respondErr(503, 'service_unavailable', 'ElevenLabs not configured. Use browser TTS fallback.')
                }
                const audioData = await callElevenLabs(body.text, body.voice_id, body.language || 'en', env.ELEVENLABS_API_KEY)
                return cors(new Response(audioData, { headers: { 'Content-Type': 'audio/mpeg' } }), origin)
            }

            // ── GET /api/fleet/analytics ─────────────────────────────────────
            if (method === 'GET' && path === '/api/fleet/analytics') {
                const [total, byStatus, topIssues, recentRisk] = await Promise.all([
                    env.DB.prepare('SELECT COUNT(*) as n FROM inspections WHERE status="complete"').first(),
                    env.DB.prepare('SELECT overall_status, COUNT(*) as n FROM inspections WHERE status="complete" GROUP BY overall_status').all(),
                    env.DB.prepare('SELECT item_name, status, COUNT(*) as n FROM inspection_items WHERE status != "GO" GROUP BY item_name, status ORDER BY n DESC LIMIT 10').all(),
                    env.DB.prepare('SELECT created_at, risk_score, overall_status FROM inspections WHERE status="complete" ORDER BY created_at DESC LIMIT 30').all()
                ])
                return respond({
                    total_inspections: (total as any)?.n || 0,
                    by_status: byStatus.results,
                    top_issues: topIssues.results,
                    risk_trend: recentRisk.results
                })
            }

            // ── GET /api/verify/:signature ───────────────────────────────────
            const verifyMatch = path.match(/^\/api\/verify\/(.+)$/)
            if (method === 'GET' && verifyMatch) {
                const sig = verifyMatch[1]
                const insp = await env.DB.prepare('SELECT * FROM inspections WHERE solana_signature=? OR report_hash=?').bind(sig, sig).first() as any
                if (!insp) return respond({ verified: false, message: 'Record not found in FieldMind' })
                return respond({
                    verified: true,
                    report_number: insp.report_number,
                    machine_model: insp.machine_model,
                    serial_number: insp.serial_number,
                    overall_status: insp.overall_status,
                    risk_score: insp.risk_score,
                    inspector_name: insp.inspector_name,
                    site_name: insp.site_name,
                    completed_at: insp.completed_at,
                    report_hash: insp.report_hash,
                    solana_verified: !!insp.solana_verified,
                    explorer_url: insp.solana_signature ? `https://explorer.solana.com/tx/${insp.solana_signature}?cluster=devnet` : null
                })
            }

            // ── POST /api/inspections/:id/sos ────────────────────────────────
            const sosMatch = path.match(/^\/api\/inspections\/([^/]+)\/sos$/)
            if (method === 'POST' && sosMatch) {
                const id = sosMatch[1]
                const insp = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first()
                if (!insp) return respondErr(404, 'not_found', 'Inspection not found')

                const now = new Date().toISOString()

                await env.DB.prepare(`
                    UPDATE inspections 
                    SET overall_status='NO-GO', risk_score=100, status='complete', completed_at=? 
                    WHERE id=?
                `).bind(now, id).run()

                await env.DB.prepare(
                    'INSERT INTO voice_events (id, transcript, intent_json, created_at) VALUES (?,?,?,?)'
                ).bind(generateId(), 'EMERGENCY SOS BUTTON ACTIVATED', JSON.stringify({ action: 'sos_alert', critical: true }), now).run()

                return respond({ success: true, message: 'SOS Alert triggered. Inspection locked as NO-GO.' })
            }

            // ── POST /api/sos ───────────────────────────────────────────────
            if (method === 'POST' && path === '/api/sos') {
                const now = new Date().toISOString()
                await env.DB.prepare(
                    'INSERT INTO voice_events (id, transcript, intent_json, created_at) VALUES (?,?,?,?)'
                ).bind(generateId(), 'GLOBAL EMERGENCY SOS ACTIVATED', JSON.stringify({ action: 'sos_alert', critical: true }), now).run()
                return respond({ success: true, message: 'Global SOS Alert triggered.' })
            }

            // ── POST /api/refine-note ────────────────────────────────────────
            if (method === 'POST' && path === '/api/refine-note') {
                const body = await request.json() as any
                const text = body.text || ''
                const targetLang = body.language || 'en'
                const action = body.action || 'grammar' // 'grammar' | 'professional' | 'concise' | 'translate'

                if (!env.OPENAI_API_KEY) return respond({ refined: text, fallback: true })

                let prompt = ''
                if (action === 'professional') {
                    prompt = `Rewrite this field inspection note to be highly professional and technical using standard CAT terminology. Return ONLY the rewritten text.`
                } else if (action === 'concise') {
                    prompt = `Condense this field inspection note to be as concise as possible using bullet points or fragments where appropriate. Return ONLY the condensed text.`
                } else if (action === 'translate') {
                    prompt = `Translate this field inspection note to ${targetLang === 'es' ? 'Spanish' : targetLang === 'pt' ? 'Portuguese' : targetLang === 'fr' ? 'French' : targetLang === 'zh' ? 'Chinese' : 'English'}. Return ONLY the translated text.`
                } else {
                    prompt = `Fix grammar and spelling in this field inspection note. Do not change the original meaning. Return ONLY the corrected text.`
                }

                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: prompt },
                            { role: 'user', content: text }
                        ],
                        max_tokens: 300
                    })
                })
                const aiData = await aiRes.json() as any
                let refined = text
                try { refined = aiData.choices[0].message.content } catch (e) { }

                return respond({ refined })
            }

            // ── GET /api/machines ────────────────────────────────────────────
            if (method === 'GET' && path === '/api/machines') {
                return respond({
                    data: [
                        { type: 'excavator', label: 'Excavator', label_es: 'Excavadora', icon: '🏗️', models: ['320', '323', '330', '336', '340', '352', '395'] },
                        { type: 'wheel_loader', label: 'Wheel Loader', label_es: 'Cargadora de Ruedas', icon: '🚜', models: ['930', '938', '950', '962', '972', '980', '982'] },
                        { type: 'bulldozer', label: 'Bulldozer', label_es: 'Topadora', icon: '🚧', models: ['D5', 'D6', 'D7', 'D8', 'D10', 'D11'] },
                        { type: 'articulated_truck', label: 'Articulated Truck', label_es: 'Camión Articulado', icon: '🚛', models: ['725', '730', '735', '740', '745'] },
                        { type: 'motor_grader', label: 'Motor Grader', label_es: 'Motoniveladora', icon: '🛣️', models: ['12M3', '14M3', '16M3'] },
                        { type: 'skid_steer', label: 'Skid Steer', label_es: 'Minicargadora', icon: '🔧', models: ['226', '232', '236', '242', '246', '262'] }
                    ]
                })
            }

            return respondErr(404, 'not_found', 'Endpoint not found')

        } catch (error: any) {
            console.error('Worker error:', error)
            return respondErr(500, 'server_error', error.message || 'Internal server error')
        }
    }
}
