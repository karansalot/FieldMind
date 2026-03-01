CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  report_number TEXT UNIQUE NOT NULL,
  inspection_number TEXT DEFAULT '',
  machine_type TEXT NOT NULL,
  machine_model TEXT NOT NULL,
  serial_number TEXT DEFAULT '',
  asset_id TEXT DEFAULT '',
  customer_name TEXT DEFAULT '',
  customer_number TEXT DEFAULT '',
  work_order TEXT DEFAULT '',
  site_name TEXT DEFAULT '',
  site_address TEXT DEFAULT '',
  inspector_name TEXT DEFAULT '',
  smu_hours INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  weather_temp INTEGER,
  weather_condition TEXT DEFAULT '',
  mode TEXT DEFAULT 'full',
  status TEXT DEFAULT 'pending',
  overall_status TEXT DEFAULT 'pending',
  risk_score INTEGER DEFAULT 0,
  pass_count INTEGER DEFAULT 0,
  monitor_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  go_count INTEGER DEFAULT 0,
  caution_count INTEGER DEFAULT 0,
  nogo_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  solana_signature TEXT DEFAULT '',
  solana_verified INTEGER DEFAULT 0,
  solana_verified_at TEXT DEFAULT '',
  report_hash TEXT DEFAULT '',
  pdf_r2_key TEXT DEFAULT '',
  nessie_purchase_id TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  section_number TEXT NOT NULL,
  section_name TEXT NOT NULL,
  item_number TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  cat_status TEXT DEFAULT 'pending',
  confidence INTEGER DEFAULT 0,
  rationale TEXT DEFAULT '',
  recommended_action TEXT DEFAULT '',
  severity INTEGER DEFAULT 1,
  has_photo INTEGER DEFAULT 0,
  photo_r2_key TEXT DEFAULT '',
  voice_note TEXT DEFAULT '',
  ai_response TEXT DEFAULT '{}',
  parts_needed TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  item_id TEXT DEFAULT '',
  r2_key TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

CREATE TABLE IF NOT EXISTS voice_events (
  id TEXT PRIMARY KEY,
  inspection_id TEXT DEFAULT '',
  transcript TEXT DEFAULT '',
  intent_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cost_events (
  id TEXT PRIMARY KEY,
  inspection_id TEXT DEFAULT '',
  vendor TEXT DEFAULT '',
  category TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  nessie_ref TEXT DEFAULT '',
  created_at TEXT NOT NULL
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
  machine_model TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  asset_id TEXT DEFAULT '',
  site_name TEXT DEFAULT '',
  smu_hours INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  last_inspection_id TEXT DEFAULT '',
  last_inspection_at TEXT DEFAULT '',
  overall_status TEXT DEFAULT 'GO',
  created_at TEXT NOT NULL
);
