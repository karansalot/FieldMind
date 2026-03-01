// Run: NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev npx ts-node scripts/seed-demo-data.ts

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'

async function post(path: string, body: any) {
    const res = await fetch(`${WORKER_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    return res.json()
}

async function seed() {
    console.log('🌱 Seeding FieldMind demo data...')

    // 1. NO-GO — English — Cold weather — PRIMARY DEMO
    const r1 = await post('/api/inspections', {
        machine_type: 'excavator', machine_model: '320', serial_number: 'MJD00123',
        asset_id: 'EX-001', inspector_name: 'John Martinez', smu_hours: 2847,
        site_name: 'Urbana Construction Site', language: 'en',
        weather_temp: 28, weather_condition: 'Snow', mode: 'full'
    }) as any
    console.log('✅ Created inspection 1:', r1.id)

    // Add NO-GO item
    await post(`/api/inspections/${r1.id}/items`, {
        section_number: '1', section_name: 'From the Ground',
        item_number: '1.3', item_name: 'Bucket Tilt Cylinders and Hoses',
        voice_note: 'Active hydraulic leak detected at left cylinder. Oil on ground.',
        manual_status: 'NO-GO'
    })
    await post(`/api/inspections/${r1.id}/items`, {
        section_number: '2', section_name: 'Engine Compartment',
        item_number: '2.1', item_name: 'Engine Oil Level',
        voice_note: 'Oil level critically low, below minimum mark.',
        manual_status: 'NO-GO'
    })
    await post(`/api/inspections/${r1.id}/items`, {
        section_number: '3', section_name: 'On the Machine, Outside the Cab',
        item_number: '3.3', item_name: 'Fire Extinguisher',
        voice_note: 'Fire extinguisher present and charged.',
        manual_status: 'GO'
    })
    await post(`/api/inspections/${r1.id}/complete`, {})
    console.log('  → Completed NO-GO inspection')

    // 2. CAUTION — Spanish — Hot weather
    const r2 = await post('/api/inspections', {
        machine_type: 'wheel_loader', machine_model: '950', serial_number: 'FWR01234',
        asset_id: 'WL-002', inspector_name: 'Carlos Mendez', smu_hours: 1847,
        site_name: 'Phoenix Desert Site', language: 'es',
        weather_temp: 97, weather_condition: 'Sunny', mode: 'full'
    }) as any
    console.log('✅ Created inspection 2:', r2.id)

    await post(`/api/inspections/${r2.id}/items`, {
        section_number: '1', section_name: 'Desde el Suelo',
        item_number: '1.1', item_name: 'Llantas y Rines',
        voice_note: 'Desgaste menor en neumático trasero derecho.',
        manual_status: 'CAUTION'
    })
    await post(`/api/inspections/${r2.id}/items`, {
        section_number: '2', section_name: 'Compartimento del Motor',
        item_number: '2.2', item_name: 'Nivel de Refrigerante',
        voice_note: 'Nivel de refrigerante por debajo del mínimo recomendado.',
        manual_status: 'CAUTION'
    })
    await post(`/api/inspections/${r2.id}/complete`, {})
    console.log('  → Completed CAUTION (Spanish) inspection')

    // 3. GO — All clear
    const r3 = await post('/api/inspections', {
        machine_type: 'bulldozer', machine_model: 'D6', serial_number: 'GXN00521',
        asset_id: 'BZ-003', inspector_name: 'Sarah Chen', smu_hours: 892,
        site_name: 'Chicago Metro Project', language: 'en',
        weather_temp: 68, weather_condition: 'Clear', mode: 'full'
    }) as any
    console.log('✅ Created inspection 3:', r3.id)

    const goItems = ['Tires and Rims', 'Engine Oil Level', 'Fire Extinguisher', 'Seat belt and mounting', 'Backup Alarm']
    for (const item of goItems) {
        await post(`/api/inspections/${r3.id}/items`, {
            section_number: '1', section_name: 'From the Ground',
            item_number: '1.1', item_name: item,
            manual_status: 'GO'
        })
    }
    await post(`/api/inspections/${r3.id}/complete`, {})
    console.log('  → Completed GO inspection')

    // 4. NO-GO — Portuguese
    const r4 = await post('/api/inspections', {
        machine_type: 'articulated_truck', machine_model: '730', serial_number: 'C1D00367',
        asset_id: 'AT-004', inspector_name: 'Bruno Silva', smu_hours: 3102,
        site_name: 'São Paulo Mining Site', language: 'pt',
        weather_temp: 85, weather_condition: 'Cloudy', mode: 'full'
    }) as any
    console.log('✅ Created inspection 4:', r4.id)
    await post(`/api/inspections/${r4.id}/items`, {
        section_number: '2', section_name: 'Compartimento do Motor',
        item_number: '2.3', item_name: 'Verificar Núcleos do Radiador',
        voice_note: 'Acúmulo grave de detritos detectado. Limpeza necessária.',
        manual_status: 'NO-GO'
    })
    await post(`/api/inspections/${r4.id}/complete`, {})
    console.log('  → Completed Portuguese inspection')

    // 5. CAUTION — Fleet demo machine
    const r5 = await post('/api/inspections', {
        machine_type: 'excavator', machine_model: '336', serial_number: 'SJD00847',
        asset_id: 'EX-005', inspector_name: 'Miguel Rodriguez', smu_hours: 4221,
        site_name: 'Caterpillar Demo Site — Peoria IL', language: 'en',
        weather_temp: 32, weather_condition: 'Freezing', mode: 'full'
    }) as any
    console.log('✅ Created inspection 5:', r5.id)
    await post(`/api/inspections/${r5.id}/items`, {
        section_number: '2', section_name: 'Engine Compartment',
        item_number: '2.7', item_name: 'Air Cleaner and Air Filter Service Indicator',
        voice_note: 'Filter restriction indicator in amber zone. Service due.',
        manual_status: 'CAUTION'
    })
    await post(`/api/inspections/${r5.id}/items`, {
        section_number: '1', section_name: 'From the Ground',
        item_number: '1.12', item_name: 'Axles - Final Drives, Differentials, Brakes, Duo-cone Seals',
        voice_note: 'Minor seepage at duo-cone seal. Cold weather may be contributing.',
        manual_status: 'CAUTION'
    })
    await post(`/api/inspections/${r5.id}/complete`, {})
    console.log('  → Completed fleet demo inspection')

    console.log('\n✅ Seeding complete! 5 inspections created.')
    console.log('Demo IDs:', { nogo_en: r1.id, caution_es: r2.id, go_en: r3.id, nogo_pt: r4.id, caution_fleet: r5.id })
}

seed().catch(console.error)
