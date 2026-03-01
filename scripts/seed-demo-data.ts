import { randomUUID } from 'crypto'

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'

async function seed() {
    console.log('🌱 Seeding FieldMind demo data to D1 database...')
    const now = new Date().toISOString()

    // Helper to insert into raw API
    const insertInspection = async (data: any) => {
        try {
            console.log(`Sending inspection: ${data.report_number}`)

            // We'll directly use the worker URLs but we need to create inspections normally
            // then manually override fields in D1 since the API doesn't allow writing `smu_hours` explicitly 
            // without starting an inspection. But wait, we can just hit the API and then mock D1 or hit a special endpoint.
            // Since this is a script, let's just make direct API calls to D1 using wrangler or a local dev server.
            // Actually, we can use the `wrangler d1 execute fieldmind-db --command "..."` for this script!
            console.log('Please run this script against the D1 database directly using Wrangler instead if you need perfect seeding.')
        } catch (e) {
            console.error(e)
        }
    }

    // Since we need to seed D1 directly from a Node script, we will generate the SQL queries
    // and run them via `wrangler d1 execute fieldmind-db --local --command="<sql>"`

    const queries: string[] = []

    // 1. NO-GO — English — Cold weather (Cat® 336)
    const id1 = randomUUID()
    queries.push(`INSERT INTO inspections (id, report_number, machine_type, machine_model, serial_number, site_name, inspector_name, smu_hours, language, weather_temp, weather_condition, mode, status, overall_status, risk_score, go_count, caution_count, nogo_count, solana_signature, solana_verified, created_at, completed_at) VALUES ('${id1}', 'FM-${now.slice(0, 10).replace(/-/g, '')}-0001', 'excavator', '336', 'SJD00847', 'Downtown Excavation', 'Demo User', 4221, 'en', 28, 'snow', 'full', 'complete', 'NO-GO', 94, 8, 1, 1, '5rM...DemoSig1', 1, '${now}', '${now}');`)

    queries.push(`INSERT INTO components (id, inspection_id, component_name, section_name, section_order, status, finding, created_at) VALUES ('${randomUUID()}', '${id1}', 'Hydraulic hoses', 'Belts & Hoses', 4, 'NO-GO', 'Major hydraulic hose rupture observed. Oil actively leaking.', '${now}');`)

    // 2. CAUTION — Spanish (Cat® 950)
    const id2 = randomUUID()
    queries.push(`INSERT INTO inspections (id, report_number, machine_type, machine_model, serial_number, site_name, inspector_name, smu_hours, language, weather_temp, weather_condition, mode, status, overall_status, risk_score, go_count, caution_count, nogo_count, created_at, completed_at) VALUES ('${id2}', 'FM-${now.slice(0, 10).replace(/-/g, '')}-0002', 'wheel_loader', '950', 'FWR01234', 'Quarry Site Alpha', 'Demo User', 1847, 'es', 97, 'sunny', 'full', 'complete', 'CAUTION', 30, 8, 2, 0, '${now}', '${now}');`)

    // 3. GO — All clear (Cat® D6)
    const id3 = randomUUID()
    queries.push(`INSERT INTO inspections (id, report_number, machine_type, machine_model, serial_number, site_name, inspector_name, smu_hours, language, weather_temp, weather_condition, mode, status, overall_status, risk_score, go_count, caution_count, nogo_count, created_at, completed_at) VALUES ('${id3}', 'FM-${now.slice(0, 10).replace(/-/g, '')}-0003', 'bulldozer', 'D6', 'GXN00521', 'Highway Expansion', 'Demo User', 892, 'en', 72, 'clear', 'full', 'complete', 'GO', 0, 10, 0, 0, '${now}', '${now}');`)

    // 4. NO-GO — DEMO MACHINE (Cat 320)
    const id4 = randomUUID()
    queries.push(`INSERT INTO inspections (id, report_number, machine_type, machine_model, serial_number, site_name, inspector_name, smu_hours, language, weather_temp, weather_condition, mode, status, overall_status, risk_score, go_count, caution_count, nogo_count, solana_signature, solana_verified, created_at, completed_at) VALUES ('${id4}', 'FM-${now.slice(0, 10).replace(/-/g, '')}-0004', 'excavator', '320', 'MJD00123', 'Demo Site', 'Demo User', 2847, 'en', 75, 'clear', 'full', 'complete', 'NO-GO', 70, 9, 0, 1, '4xg...DemoSig4', 1, '${now}', '${now}');`)

    // 5. CAUTION — Portuguese (Cat® 730)
    const id5 = randomUUID()
    queries.push(`INSERT INTO inspections (id, report_number, machine_type, machine_model, serial_number, site_name, inspector_name, smu_hours, language, weather_temp, weather_condition, mode, status, overall_status, risk_score, go_count, caution_count, nogo_count, created_at, completed_at) VALUES ('${id5}', 'FM-${now.slice(0, 10).replace(/-/g, '')}-0005', 'articulated_truck', '730', 'C1D00367', 'Mining Operation', 'Demo User', 3102, 'pt', 80, 'clear', 'full', 'complete', 'CAUTION', 15, 9, 1, 0, '${now}', '${now}');`)

    // Save queries to a temp file and execute it
    const fs = require('fs')
    const path = require('path')
    const tempFile = path.join(__dirname, '..', 'worker', 'seed-temp.sql')
    fs.writeFileSync(tempFile, queries.join('\\n'))

    console.log('Generated SQL file at ' + tempFile)
    console.log('Run the following command to inject the data:')
    console.log('npx wrangler d1 execute fieldmind-db --local --file=./worker/seed-temp.sql')
    console.log('npx wrangler d1 execute fieldmind-db --file=./worker/seed-temp.sql # (for remote)')

}

seed()
