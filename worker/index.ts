import { verifyOnSolana } from './solana'
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

function cors(r: Response): Response {
    const h = new Headers(r.headers)
    h.set('Access-Control-Allow-Origin', '*')
    h.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    h.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return new Response(r.body, { status: r.status, headers: h })
}
function json(data: any, status = 200): Response {
    return cors(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }))
}
function err(status: number, code: string, message: string): Response {
    return json({ error: { code, message }, request_id: `req_${Date.now()}` }, status)
}
function id() { return crypto.randomUUID() }
function reportNum() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `FM-${d}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
}

const SYSTEM_PROMPT = (lang: string, weatherCtx: string, history: string) => `You are FieldMind Inspector Agent — AI built on Caterpillar & JCB inspection standards. Part of a 5-agent system.

LANGUAGE: ${lang === 'es' ? 'Respond entirely in Spanish. Use construction/equipment terminology in Spanish. Part numbers always in English format.' : lang === 'pt' ? 'Respond entirely in Portuguese.' : lang === 'fr' ? 'Respond entirely in French.' : lang === 'zh' ? '用中文回复。' : 'Respond in English.'}

ASSESSMENT CRITERIA:
GO: No visible damage. Normal wear. Fluids normal. No leaks. Safe to operate.
CAUTION: Minor damage/wear. Fluid approaching minimum. Small leak or early crack. Schedule maintenance within 30 days.
NO-GO: Significant damage. Fluid critically low. Active leak. DO NOT OPERATE. Immediate repair required.

WEATHER: ${weatherCtx}
Cold (<32°F): seals brittle, hydraulics sluggish, battery reduced.
Hot (>95°F): coolant critical, hydraulic overheating risk.
Rain/Snow: electrical and slip hazards elevated.
Adjust assessment accordingly.

LIFTING EQUIPMENT RULES (JCB/CAT telehandler/crane):
- Any crack in lifting mast/boom = immediate NO-GO
- Fork wear >10% of original thickness = NO-GO
- SLI (Safe Load Indicator) not functional = NO-GO
- Load chain elongation >3% = NO-GO
- Missing or defective safety latch on hook = NO-GO

MACHINE HISTORY: ${history || 'No previous inspection history.'}

CAT PARTS: 1R-0750 Engine Oil Filter, 326-1643 Hydraulic Filter, 175-2949 Air Filter, 6V-4965 Hydraulic Seal Kit, 6Y-3222 Bucket Tooth, 8E-6252 Tooth Adapter, 5P-0960 O-Ring Seal, 2J-3506 Track Bolt

RETURN ONLY VALID JSON MATCHING THIS EXACT HYBRID DATASET STRUCTURE:
{
  "assessment": { "status": "GO|CAUTION|NO-GO", "confidence": 0-100, "overall_finding": "Summary of the component's state" },
  "anomalies": [
    {
      "component_location": "string (e.g., Upper Step, Hydraulic Cylinder Mounting, Coolant Reservoir)",
      "component_type": "string (e.g., Step, Hose, Glass, Mounting System)",
      "condition_description": "string (Detailed description of observed condition or failure)",
      "safety_impact_assessment": "string (Critical/Moderate/None - personnel safety risks)",
      "visibility_impact": "string (Effect on operator visibility)",
      "operational_impact": "string (Effect on equipment access/maintenance)",
      "recommended_action": "string (Immediate repair, scheduled maintenance, clean, etc.)",
      "severity": "Critical|Major|Minor",
      "risk_level": "None|Low|Moderate|Critical"
    }
  ],
  "action": { "immediate": "string", "parts_needed": [{ "part_number": "string", "part_name": "string", "quantity": 1 }], "estimated_repair_cost": "string" },
  "proactive": { "next_service_due": "string", "weather_note": "string" }
}`

const AR_SYSTEM_PROMPT = `You are FieldMind AR Vision Agent. Analyze this image of construction/lifting equipment.
Identify ALL visible components (hydraulics, engine parts, structural elements, lifting gear, filters, hoses, etc.).
For each component, estimate its bounding box as fractions of image width/height (0.0 to 1.0).
RETURN ONLY VALID JSON:
{
  "detections": [
    {
      "label": "Hydraulic Hose",
      "part_number": "326-1643",
      "status": "CAUTION",
      "confidence": 87,
      "bbox": { "x": 0.1, "y": 0.2, "w": 0.3, "h": 0.15 }
    }
  ]
}
Limit to 6 most prominent/important components. Keep bounding boxes tight around the actual component.`

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))

        const url = new URL(request.url)
        const path = url.pathname

        try {
            // Health
            if (path === '/api/health') return json({ status: 'ok', app: 'FieldMind', version: '2.0.0' })

            // Machines list
            if (path === '/api/machines') {
                return json({
                    data: [
                        { type: 'excavator', brand: 'CAT', label: 'Excavator', icon: '🏗️', models: ['320', '323', '330', '336', '340', '352', '395'], lifting: false },
                        { type: 'wheel_loader', brand: 'CAT', label: 'Wheel Loader', icon: '🚜', models: ['930', '938', '950', '962', '972', '980'], lifting: false },
                        { type: 'bulldozer', brand: 'CAT', label: 'Bulldozer', icon: '🚧', models: ['D5', 'D6', 'D7', 'D8', 'D10', 'D11'], lifting: false },
                        { type: 'articulated_truck', brand: 'CAT', label: 'Articulated Truck', icon: '🚛', models: ['725', '730', '735', '740', '745'], lifting: false },
                        { type: 'motor_grader', brand: 'CAT', label: 'Motor Grader', icon: '🛣️', models: ['12M3', '14M3', '16M3'], lifting: false },
                        { type: 'skid_steer', brand: 'CAT', label: 'Skid Steer', icon: '🔧', models: ['226', '236', '242', '246', '262'], lifting: false },
                        { type: 'telehandler', brand: 'CAT', label: 'Telehandler', icon: '🏋️', models: ['TH306C', 'TH357D', 'TH408D', 'TH514D'], lifting: true },
                        { type: 'rt_forklift', brand: 'CAT', label: 'Rough Terrain Forklift', icon: '🍴', models: ['P6000', 'P8000', 'P10000'], lifting: true },
                        { type: 'backhoe', brand: 'JCB', label: 'Backhoe Loader', icon: '🏗️', models: ['3CX', '4CX', '5CX'], lifting: false },
                        { type: 'telehandler_jcb', brand: 'JCB', label: 'Telehandler', icon: '🏋️', models: ['509-42', '510-56', '540-140', '560-80'], lifting: true },
                        { type: 'skid_steer_jcb', brand: 'JCB', label: 'Skid Steer', icon: '🔧', models: ['155', '175', '190T', '205T'], lifting: false },
                        { type: 'excavator_jcb', brand: 'JCB', label: 'Excavator', icon: '⛏️', models: ['85Z-1', '100C', '130', '145', '220', '245'], lifting: false },
                    ]
                })
            }

            // Create inspection
            if (request.method === 'POST' && path === '/api/inspections') {
                const body: any = await request.json()
                if (!body.machine_type || !body.machine_model) return err(400, 'validation_error', 'machine_type and machine_model required')
                const inspId = id(), rn = reportNum(), now = new Date().toISOString()
                await env.DB.prepare(`INSERT INTO inspections (id,report_number,machine_type,machine_brand,machine_model,serial_number,site_name,inspector_name,smu_hours,language,weather_temp,weather_condition,mode,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
                    .bind(inspId, rn, body.machine_type, body.machine_brand || 'CAT', body.machine_model, body.serial_number || '', body.site_name || '', body.inspector_name || '', body.smu_hours || 0, body.language || 'en', body.weather_temp || null, body.weather_condition || '', body.mode || 'full', now)
                    .run()
                return json({ id: inspId, report_number: rn, status: 'pending', created_at: now }, 201)
            }

            // List inspections
            if (request.method === 'GET' && path === '/api/inspections') {
                const limit = parseInt(url.searchParams.get('limit') || '10')
                const rows = await env.DB.prepare('SELECT * FROM inspections ORDER BY created_at DESC LIMIT ?').bind(limit).all()
                return json({ data: rows.results, total: rows.results.length })
            }

            // Get inspection
            const inspMatch = path.match(/^\/api\/inspections\/([^/]+)$/)
            if (request.method === 'GET' && inspMatch) {
                const insp: any = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(inspMatch[1]).first()
                if (!insp) return err(404, 'not_found', 'Inspection not found')
                const comps = await env.DB.prepare('SELECT * FROM components WHERE inspection_id=? ORDER BY section_order,created_at').bind(inspMatch[1]).all()
                return json({ ...insp, components: comps.results })
            }

            // Analyze component
            const compMatch = path.match(/^\/api\/inspections\/([^/]+)\/components$/)
            if (request.method === 'POST' && compMatch) {
                const inspId = compMatch[1]
                const body: any = await request.json()
                if (!body.component_name) return err(400, 'validation_error', 'component_name required')

                const insp: any = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(inspId).first()
                const lang = insp?.language || 'en'
                const weatherCtx = insp?.weather_temp ? `Temperature: ${insp.weather_temp}°F, Condition: ${insp.weather_condition}` : 'Not available'
                let history = ''
                try { if (insp?.serial_number) history = await searchSupermemory(`${insp.machine_model} ${insp.serial_number}`, env.SUPERMEMORY_API_KEY) } catch { }

                const messages: any[] = [{
                    role: 'user',
                    content: body.image_base64
                        ? [{ type: 'text', text: `Inspect: ${body.component_name}${body.voice_note ? `\nInspector says: "${body.voice_note}"` : ''}` }, { type: 'image_url', image_url: { url: body.image_base64.startsWith('data:') ? body.image_base64 : `data:image/jpeg;base64,${body.image_base64}` } }]
                        : [{ type: 'text', text: `Inspect component: ${body.component_name}.${body.voice_note ? `\nInspector says: "${body.voice_note}"` : '\nNo photo — give general guidance.'}` }]
                }]

                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM_PROMPT(lang, weatherCtx, history) }, ...messages], max_tokens: 1000, response_format: { type: 'json_object' } })
                })
                const aiData: any = await aiRes.json()
                let result: any = { assessment: { status: 'CAUTION', confidence: 50, overall_finding: 'Manual inspection recommended.' }, anomalies: [], action: { immediate: 'Inspect manually', parts_needed: [], estimated_repair_cost: 'TBD' }, proactive: { next_service_due: 'Check manual', weather_note: '' } }
                try { result = JSON.parse(aiData.choices[0].message.content) } catch { }

                const compId = id(), now = new Date().toISOString()
                const status = result.assessment?.status || 'CAUTION'

                // Map the new anomalies structure into a readable finding for the frontend
                const finding = result.assessment?.overall_finding || (result.anomalies?.[0]?.condition_description || 'Condition unknown')
                const observations = (result.anomalies || []).map((a: any) => `${a.component_location} (${a.severity}): ${a.condition_description} Action: ${a.recommended_action}`)

                const dbResultDetails = {
                    observations,
                    affected_area: result.anomalies?.[0]?.component_location || 'General',
                    safety_impact: result.anomalies?.[0]?.safety_impact_assessment || 'Unknown'
                }

                await env.DB.prepare(`INSERT INTO components (id,inspection_id,component_name,section_name,section_order,status,confidence,finding,voice_note,ai_response,parts_needed,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
                    .bind(compId, inspId, body.component_name, body.section_name || 'General', body.section_order || 0, status, result.assessment?.confidence || 50, finding, body.voice_note || '', JSON.stringify(result), JSON.stringify(result.action?.parts_needed || []), now).run()

                if (status === 'GO') await env.DB.prepare('UPDATE inspections SET go_count=go_count+1 WHERE id=?').bind(inspId).run()
                else if (status === 'CAUTION') await env.DB.prepare('UPDATE inspections SET caution_count=caution_count+1 WHERE id=?').bind(inspId).run()
                else if (status === 'NO-GO') await env.DB.prepare('UPDATE inspections SET nogo_count=nogo_count+1 WHERE id=?').bind(inspId).run()

                return json({
                    id: compId, inspection_id: inspId, status,
                    confidence: result.assessment?.confidence,
                    finding: finding,
                    details: dbResultDetails,
                    action: result.action,
                    proactive: result.proactive
                }, 201)
            }

            // Complete inspection
            const completeMatch = path.match(/^\/api\/inspections\/([^/]+)\/complete$/)
            if (request.method === 'POST' && completeMatch) {
                const insp: any = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(completeMatch[1]).first()
                if (!insp) return err(404, 'not_found', 'Inspection not found')
                const overall = insp.nogo_count > 0 ? 'NO-GO' : insp.caution_count > 0 ? 'CAUTION' : 'GO'
                const risk = insp.nogo_count > 0 ? Math.min(100, 50 + insp.nogo_count * 20 + insp.caution_count * 5) : Math.min(75, insp.caution_count * 15)
                const now = new Date().toISOString()
                await env.DB.prepare(`UPDATE inspections SET overall_status=?,risk_score=?,status='complete',completed_at=? WHERE id=?`).bind(overall, risk, now, insp.id).run()

                try {
                    const comps = await env.DB.prepare('SELECT * FROM components WHERE inspection_id=?').bind(insp.id).all()
                    await saveToSupermemory({ machine_model: insp.machine_model, serial_number: insp.serial_number, overall_status: overall, risk_score: risk, nogo_items: comps.results.filter((c: any) => c.status === 'NO-GO').map((c: any) => c.component_name), caution_items: comps.results.filter((c: any) => c.status === 'CAUTION').map((c: any) => c.component_name), smu_hours: insp.smu_hours, report_number: insp.report_number, inspection_id: insp.id }, env.SUPERMEMORY_API_KEY)
                } catch { }
                if (overall !== 'GO') { try { await trackNessieExpense({ inspection_id: insp.id, machine_model: insp.machine_model, status: overall, risk_score: risk }, env.NESSIE_API_KEY) } catch { } }

                return json({ id: insp.id, overall_status: overall, risk_score: risk, go_count: insp.go_count, caution_count: insp.caution_count, nogo_count: insp.nogo_count, completed_at: now })
            }

            // Blockchain verify
            const verifyMatch = path.match(/^\/api\/inspections\/([^/]+)\/verify-blockchain$/)
            if (request.method === 'POST' && verifyMatch) {
                const insp: any = await env.DB.prepare('SELECT * FROM inspections WHERE id=?').bind(verifyMatch[1]).first()
                if (!insp) return err(404, 'not_found', 'Inspection not found')
                if (insp.solana_verified) return json({ signature: insp.solana_signature, explorer_url: `https://explorer.solana.com/tx/${insp.solana_signature}?cluster=devnet`, verified_at: insp.solana_verified_at, already_verified: true })
                const result = await verifyOnSolana({ id: insp.id, report_number: insp.report_number, machine_model: insp.machine_model, status: insp.overall_status, risk_score: insp.risk_score, nogo_count: insp.nogo_count, caution_count: insp.caution_count }, env.SOLANA_PRIVATE_KEY)
                await env.DB.prepare('UPDATE inspections SET solana_signature=?,solana_verified=1,solana_verified_at=? WHERE id=?').bind(result.signature, result.verified_at, insp.id).run()
                return json(result)
            }

            // Verify by signature
            const sigMatch = path.match(/^\/api\/verify\/(.+)$/)
            if (request.method === 'GET' && sigMatch) {
                const insp: any = await env.DB.prepare('SELECT * FROM inspections WHERE solana_signature=?').bind(sigMatch[1]).first()
                if (!insp) return json({ verified: false, message: 'Signature not found' })
                return json({ verified: true, report_number: insp.report_number, machine_model: insp.machine_model, machine_brand: insp.machine_brand, serial_number: insp.serial_number, overall_status: insp.overall_status, risk_score: insp.risk_score, inspector_name: insp.inspector_name, site_name: insp.site_name, completed_at: insp.completed_at, explorer_url: `https://explorer.solana.com/tx/${sigMatch[1]}?cluster=devnet` })
            }

            // Parts identify
            if (request.method === 'POST' && path === '/api/parts/identify') {
                const body: any = await request.json()
                const lang = body.language || 'en'
                const langNote = lang === 'es' ? 'Responde en español. Nombres en español, números en inglés.' : ''
                const msgs: any[] = [{
                    role: 'user', content: body.image_base64
                        ? [{ type: 'text', text: `Identify this CAT/JCB equipment part. ${langNote} Return JSON: {"parts":[{"rank":1,"part_number":"","part_name":"","confidence":0,"category":"","fits_models":[],"price_estimate":"","order_url":"https://parts.cat.com/en/catcorp","why":""}]}` }, { type: 'image_url', image_url: { url: body.image_base64.startsWith('data:') ? body.image_base64 : `data:image/jpeg;base64,${body.image_base64}` } }]
                        : [{ type: 'text', text: `Identify CAT/JCB part: "${body.description}". Machine: ${body.machine_model || 'unknown'}. ${langNote} Return JSON: {"parts":[{"rank":1,"part_number":"","part_name":"","confidence":0,"category":"","fits_models":[],"price_estimate":"","order_url":"https://parts.cat.com/en/catcorp","why":""}]}` }]
                }]
                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: 'You are a CAT/JCB parts expert. Return only valid JSON.' }, ...msgs], max_tokens: 800, response_format: { type: 'json_object' } })
                })
                const aiData: any = await aiRes.json()
                let result = { parts: [] }
                try { result = JSON.parse(aiData.choices[0].message.content) } catch { }
                await env.DB.prepare('INSERT INTO parts_searches (id,description,results,language,created_at) VALUES (?,?,?,?,?)').bind(id(), body.description || 'image', JSON.stringify((result as any).parts || []), lang, new Date().toISOString()).run()
                return json(result)
            }

            // AR real-time analysis
            if (request.method === 'POST' && path === '/api/ar/analyze') {
                const body: any = await request.json()
                if (!body.image_base64) return err(400, 'validation_error', 'image_base64 required')
                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: AR_SYSTEM_PROMPT }, { role: 'user', content: [{ type: 'text', text: `Machine: ${body.machine_model || 'CAT Equipment'}. Identify components in this image.` }, { type: 'image_url', image_url: { url: body.image_base64.startsWith('data:') ? body.image_base64 : `data:image/jpeg;base64,${body.image_base64}` } }] }], max_tokens: 600, response_format: { type: 'json_object' } })
                })
                const aiData: any = await aiRes.json()
                let result = { detections: [] }
                try { result = JSON.parse(aiData.choices[0].message.content) } catch { }
                return json(result)
            }

            // TTS
            if (request.method === 'POST' && path === '/api/tts') {
                const body: any = await request.json()
                const audio = await callElevenLabs(body.text, body.voice_id, body.language || 'en', env.ELEVENLABS_API_KEY)
                return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Access-Control-Allow-Origin': '*' } })
            }

            // Fleet analytics
            if (request.method === 'GET' && path === '/api/fleet/analytics') {
                const total: any = await env.DB.prepare('SELECT COUNT(*) as n FROM inspections').first()
                const byStatus = await env.DB.prepare(`SELECT overall_status, COUNT(*) as n FROM inspections WHERE status='complete' GROUP BY overall_status`).all()
                const recent = await env.DB.prepare(`SELECT * FROM inspections WHERE status='complete' ORDER BY created_at DESC LIMIT 20`).all()
                return json({ total_inspections: total?.n || 0, by_status: byStatus.results, recent: recent.results })
            }

            return err(404, 'not_found', 'Endpoint not found')
        } catch (e: any) {
            console.error('Worker error:', e)
            return err(500, 'server_error', e.message || 'Internal server error')
        }
    }
}
