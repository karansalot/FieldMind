CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  report_number TEXT UNIQUE NOT NULL,
  machine_type TEXT NOT NULL,
  machine_brand TEXT DEFAULT 'CAT',
  machine_model TEXT NOT NULL,
  serial_number TEXT DEFAULT '',
  site_name TEXT DEFAULT '',
  inspector_name TEXT DEFAULT '',
  smu_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  overall_status TEXT DEFAULT 'pending',
  risk_score INTEGER DEFAULT 0,
  go_count INTEGER DEFAULT 0,
  caution_count INTEGER DEFAULT 0,
  nogo_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  weather_temp INTEGER,
  weather_condition TEXT DEFAULT '',
  mode TEXT DEFAULT 'full',
  created_at TEXT NOT NULL,
  completed_at TEXT,
  solana_signature TEXT DEFAULT '',
  solana_verified INTEGER DEFAULT 0,
  solana_verified_at TEXT DEFAULT '',
  nessie_purchase_id TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS components (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  confidence INTEGER DEFAULT 0,
  finding TEXT DEFAULT '',
  photo_r2_key TEXT DEFAULT '',
  ai_response TEXT DEFAULT '{}',
  parts_needed TEXT DEFAULT '[]',
  voice_note TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

CREATE TABLE IF NOT EXISTS parts_searches (
  id TEXT PRIMARY KEY,
  inspection_id TEXT DEFAULT '',
  description TEXT DEFAULT '',
  results TEXT DEFAULT '[]',
  language TEXT DEFAULT 'en',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fleet_machines (
  id TEXT PRIMARY KEY,
  machine_brand TEXT DEFAULT 'CAT',
  machine_model TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  site_name TEXT DEFAULT '',
  smu_hours INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  last_inspection_id TEXT DEFAULT '',
  last_inspection_at TEXT DEFAULT '',
  overall_status TEXT DEFAULT 'GO',
  created_at TEXT NOT NULL
);
