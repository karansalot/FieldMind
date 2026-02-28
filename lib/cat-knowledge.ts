// Lifting machine specific components for AR pop-up
export const LIFTING_COMPONENTS = [
    { id: 'mast', name: 'Lifting Mast / Boom', name_es: 'Mástil / Pluma', ar_keywords: ['mast', 'boom', 'arm', 'crane'], check: 'Inspect for cracks, bends, or weld failures. Critical — NO-GO if any found.' },
    { id: 'fork_carriage', name: 'Fork Carriage & Forks', name_es: 'Portahorquillas y Horquillas', ar_keywords: ['fork', 'carriage', 'tine'], check: 'Check for cracks at heel, bends >3° or wear >10% of original thickness = NO-GO.' },
    { id: 'load_chains', name: 'Load Chains', name_es: 'Cadenas de Carga', ar_keywords: ['chain', 'link'], check: 'Check for elongation, twisted links, corrosion. Replace if >3% elongation.' },
    { id: 'outriggers', name: 'Outriggers / Stabilizers', name_es: 'Estabilizadores', ar_keywords: ['outrigger', 'stabilizer', 'leg'], check: 'Extend and verify level. Check pads for damage.' },
    { id: 'boom_cylinder', name: 'Boom Lift Cylinder', name_es: 'Cilindro de Elevación', ar_keywords: ['cylinder', 'hydraulic', 'piston'], check: 'Check for leaks, scored rod, damaged seals.' },
    { id: 'safety_cage', name: 'Operator Safety Cage / ROPS', name_es: 'Jaula de Seguridad', ar_keywords: ['cage', 'rops', 'guard'], check: 'Verify integrity. Any structural damage = NO-GO immediately.' },
    { id: 'load_indicator', name: 'Safe Load Indicator (SLI)', name_es: 'Indicador de Carga Segura', ar_keywords: ['sli', 'indicator', 'load'], check: 'Test SLI function before each lift. Non-functional = NO-GO.' },
    { id: 'hook_block', name: 'Hook Block & Safety Latch', name_es: 'Gancho y Seguro', ar_keywords: ['hook', 'latch', 'block'], check: 'Safety latch must snap closed. Any deformation = NO-GO.' },
]

export const CAT_MACHINES = {
    excavator: {
        label: 'Excavator',
        label_es: 'Excavadora',
        label_pt: 'Escavadeira',
        label_fr: 'Pelle',
        label_zh: '挖掘机',
        icon: '🏗️',
        models: ['320', '323', '330', '336', '340', '352', '395'],
        prefixes: { '320': 'MJD', '323': 'PJD', '330': 'RJD', '336': 'SJD', '340': 'TJD', '352': 'WJD', '395': 'XJD' }
    },
    wheel_loader: {
        label: 'Wheel Loader',
        label_es: 'Cargadora de Ruedas',
        label_pt: 'Carregadeira de Rodas',
        label_fr: 'Chargeur sur Pneus',
        label_zh: '轮式装载机',
        icon: '🚜',
        models: ['930', '938', '950', '962', '972', '980'],
        prefixes: { '930': 'DWR', '938': 'EWR', '950': 'FWR', '962': 'GWR', '972': 'HWR', '980': 'JWR' }
    },
    bulldozer: {
        label: 'Bulldozer',
        label_es: 'Topadora',
        label_pt: 'Escavadeira de Esteiras',
        label_fr: 'Bouteur',
        label_zh: '推土机',
        icon: '🚧',
        models: ['D5', 'D6', 'D7', 'D8', 'D10', 'D11'],
        prefixes: { 'D5': 'FXN', 'D6': 'GXN', 'D7': 'HXN', 'D8': 'JXN', 'D10': 'LXN', 'D11': 'MXN' }
    },
    articulated_truck: {
        label: 'Articulated Truck',
        label_es: 'Camión Articulado',
        label_pt: 'Caminhão Articulado',
        label_fr: 'Tombereau Articulé',
        label_zh: '铰接式卡车',
        icon: '🚛',
        models: ['725', '730', '735', '740', '745'],
        prefixes: { '725': 'B1D', '730': 'C1D', '735': 'D1D', '740': 'E1D', '745': 'F1D' }
    },
    motor_grader: {
        label: 'Motor Grader',
        label_es: 'Motoniveladora',
        label_pt: 'Motoniveladora',
        label_fr: 'Niveleuse',
        label_zh: '平地机',
        icon: '🛣️',
        models: ['12M3', '14M3', '16M3'],
        prefixes: { '12M3': 'B9D', '14M3': 'C9D', '16M3': 'D9D' }
    },
    skid_steer: {
        label: 'Skid Steer',
        label_es: 'Minicargadora',
        label_pt: 'Minicarregadeira',
        label_fr: 'Chargeuse Compacte',
        label_zh: '滑移装载机',
        icon: '🔧',
        models: ['226', '232', '236', '242', '246', '262'],
        prefixes: { '226': 'HXS', '232': 'JXS', '236': 'KXS', '242': 'LXS', '246': 'MXS', '262': 'NXS' }
    }
} as const

export const CAT_PARTS = [
    { number: '1R-0750', name: 'Engine Oil Filter', name_es: 'Filtro de Aceite de Motor', category: 'Filters & Fluids', fits: ['320', '323', '330', '336', '340'], interval_hours: 500, price_est: '$45-65', symptoms: ['dark oil', 'oil pressure low', 'engine noise'] },
    { number: '1R-0716', name: 'Engine Oil Filter', name_es: 'Filtro de Aceite de Motor', category: 'Filters & Fluids', fits: ['930', '938', '950', '962', '972'], interval_hours: 500, price_est: '$40-60', symptoms: ['dark oil', 'oil pressure low'] },
    { number: '326-1643', name: 'Hydraulic Return Filter', name_es: 'Filtro de Retorno Hidráulico', category: 'Hydraulics', fits: ['320', '323', '330', '336', '340', '352'], interval_hours: 1000, price_est: '$85-120', symptoms: ['slow hydraulics', 'hydraulic noise', 'dirty fluid'] },
    { number: '175-2949', name: 'Air Filter Primary Element', name_es: 'Elemento Primario del Filtro de Aire', category: 'Engine', fits: ['320', '330', '336', '950', '980'], interval_hours: 500, price_est: '$55-75', symptoms: ['black smoke', 'power loss', 'high air restriction'] },
    { number: '156-3124', name: 'Fuel Filter', name_es: 'Filtro de Combustible', category: 'Filters & Fluids', fits: ['320', '323', '330', '336', '340', '352'], interval_hours: 500, price_est: '$35-55', symptoms: ['engine stall', 'hard start', 'power loss'] },
    { number: '6V-4965', name: 'Hydraulic Seal Kit', name_es: 'Kit de Sellos Hidráulicos', category: 'Hydraulics', fits: ['320', '330', '336', '340', '352'], interval_hours: 2000, price_est: '$180-250', symptoms: ['hydraulic leak', 'slow cylinder', 'oil on ground'] },
    { number: '5P-0960', name: 'O-Ring Seal', name_es: 'Sello de Anillo O', category: 'Hardware/Seals', fits: ['ALL'], interval_hours: null, price_est: '$8-15', symptoms: ['any leak', 'fluid seeping'] },
    { number: '2J-3506', name: 'Track Bolt and Nut', name_es: 'Perno y Tuerca de Oruga', category: 'Undercarriage', fits: ['320', '330', '336', '340', '352', '395'], interval_hours: null, price_est: '$12-20', symptoms: ['loose track', 'track noise', 'missing bolt'] },
    { number: '6Y-3222', name: 'Bucket Tooth', name_es: 'Diente del Cucharón', category: 'Ground Engaging Tools', fits: ['320', '323', '330', '336'], interval_hours: null, price_est: '$45-80', symptoms: ['worn teeth', 'digging difficulty', 'tooth missing'] },
    { number: '8E-6252', name: 'Tooth Adapter', name_es: 'Adaptador de Diente', category: 'Ground Engaging Tools', fits: ['320', '323', '330', '336', '340'], interval_hours: null, price_est: '$120-180', symptoms: ['loose tooth', 'adapter wear', 'tooth loss'] }
]

export const INSPECTION_SECTIONS = [
    { order: 1, id: 'safety', name: 'Safety Items', name_es: 'Elementos de Seguridad', name_pt: 'Itens de Segurança', name_fr: 'Éléments de Sécurité', name_zh: '安全项目', critical: true, icon: '🦺', components: ['Fire extinguisher', 'Safety labels and decals', 'Emergency exits', 'Backup alarm', 'Seat belt and ROPS'] },
    { order: 2, id: 'fluids', name: 'Fluid Levels', name_es: 'Niveles de Fluidos', name_pt: 'Níveis de Fluidos', name_fr: 'Niveaux de Fluides', name_zh: '液体液位', critical: false, icon: '🛢️', components: ['Engine oil level', 'Hydraulic oil level', 'Coolant level', 'Fuel level', 'DEF/AdBlue level'] },
    { order: 3, id: 'filters', name: 'Filters', name_es: 'Filtros', name_pt: 'Filtros', name_fr: 'Filtres', name_zh: '滤清器', critical: false, icon: '🔧', components: ['Engine air filter', 'Hydraulic return filter', 'Fuel filter', 'Cabin air filter'] },
    { order: 4, id: 'hoses', name: 'Belts & Hoses', name_es: 'Correas y Mangueras', name_pt: 'Correias e Mangueiras', name_fr: 'Courroies et Tuyaux', name_zh: '皮带和软管', critical: false, icon: '〰️', components: ['Serpentine belt condition', 'Hydraulic hoses', 'Coolant hoses', 'Fuel lines'] },
    { order: 5, id: 'undercarriage', name: 'Undercarriage', name_es: 'Tren de Rodaje', name_pt: 'Trem de Rolamento', name_fr: 'Châssis', name_zh: '底盘', critical: false, icon: '⚙️', components: ['Track tension', 'Track shoe condition', 'Sprocket wear', 'Idler condition', 'Roller condition'] },
    { order: 6, id: 'attachments', name: 'Attachments', name_es: 'Implementos', name_pt: 'Implementos', name_fr: 'Équipements', name_zh: '附件', critical: false, icon: '🪣', components: ['Bucket teeth and edges', 'Attachment pins and bushings', 'Quick coupler condition', 'Hydraulic attachment lines'] },
    { order: 7, id: 'cab', name: 'Cab & Controls', name_es: 'Cabina y Controles', name_pt: 'Cabine e Controles', name_fr: 'Cabine et Commandes', name_zh: '驾驶室与控制', critical: false, icon: '🎮', components: ['Seat and seat belt', 'Joystick and pedal controls', 'Monitor and gauges', 'Windshield and wipers', 'Cab door and latches'] },
    { order: 8, id: 'electrical', name: 'Electrical', name_es: 'Sistema Eléctrico', name_pt: 'Sistema Elétrico', name_fr: 'Système Électrique', name_zh: '电气系统', critical: false, icon: '⚡', components: ['Battery condition and terminals', 'Work lights', 'Travel lights and warning lights', 'Wiring harness condition'] },
    { order: 9, id: 'engine', name: 'Engine Compartment', name_es: 'Compartimento del Motor', name_pt: 'Compartimento do Motor', name_fr: 'Compartiment Moteur', name_zh: '发动机舱', critical: false, icon: '🔩', components: ['Engine oil leaks', 'Coolant leaks', 'Fuel leaks', 'Belt condition', 'Overall engine cleanliness'] },
    { order: 10, id: 'overall', name: 'Overall Condition', name_es: 'Condición General', name_pt: 'Condição Geral', name_fr: 'État Général', name_zh: '整体状况', critical: false, icon: '📋', components: ['Structural cracks or damage', 'Paint and corrosion', 'Steps and handrails', 'General cleanliness'] }
]

export const QUICK_CHECK_COMPONENTS = [
    { id: 'walkaround', name: 'Walk-around visual', name_es: 'Revisión visual', icon: '👁️' },
    { id: 'fluids', name: 'Fluid levels', name_es: 'Niveles de fluidos', icon: '🛢️' },
    { id: 'tracks', name: 'Track / tire condition', name_es: 'Condición de orugas / ruedas', icon: '⚙️' },
    { id: 'lights', name: 'All lights operational', name_es: 'Luces operacionales', icon: '💡' },
    { id: 'cab', name: 'Cab entry and controls', name_es: 'Cabina y controles', icon: '🎮' },
    { id: 'leaks', name: 'Check under machine for leaks', name_es: 'Revisar fugas bajo la máquina', icon: '💧' }
]

export const STATUS_CONFIG = {
    GO: {
        label: 'GO',
        labels: { en: 'GO', es: 'CONTINUAR', pt: 'SEGUIR', fr: 'ALLER', zh: '通过' },
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.08)',
        border: 'rgba(34,197,94,0.25)',
        icon: '✅',
        vibrate: [50],
        actions: {
            en: 'Continue normal operations',
            es: 'Continuar operaciones normales',
            pt: 'Continuar operações normais',
            fr: 'Continuer les opérations normales',
            zh: '继续正常操作'
        }
    },
    CAUTION: {
        label: 'CAUTION',
        labels: { en: 'CAUTION', es: 'PRECAUCIÓN', pt: 'CUIDADO', fr: 'ATTENTION', zh: '注意' },
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        icon: '⚠️',
        vibrate: [100, 50, 100],
        actions: {
            en: 'Schedule maintenance within 30 days',
            es: 'Programar mantenimiento en 30 días',
            pt: 'Agendar manutenção em 30 dias',
            fr: 'Planifier la maintenance sous 30 jours',
            zh: '30天内安排维护'
        }
    },
    'NO-GO': {
        label: 'NO-GO',
        labels: { en: 'NO-GO', es: 'NO OPERAR', pt: 'NÃO OPERAR', fr: 'ARRÊT', zh: '停止' },
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
        icon: '🛑',
        vibrate: [200, 100, 200, 100, 400],
        actions: {
            en: 'Do not operate. Immediate repair required.',
            es: 'No operar. Reparación inmediata requerida.',
            pt: 'Não operar. Reparo imediato necessário.',
            fr: 'Ne pas opérer. Réparation immédiate requise.',
            zh: '请勿操作。需要立即维修。'
        }
    }
} as const

export const SERVICE_INTERVALS = {
    default: {
        engine_oil: { hours: 500, part: '1R-0750' },
        hydraulic_filter: { hours: 1000, part: '326-1643' },
        air_filter: { hours: 500, part: '175-2949' },
        fuel_filter: { hours: 500, part: '156-3124' },
        coolant: { hours: 4000, part: null },
        final_drive_oil: { hours: 2000, part: null }
    }
}

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'zh'
export type InspectionStatus = 'GO' | 'CAUTION' | 'NO-GO'
