# FieldMind — The AI Brain for Field Operations
> HackIllinois 2026 | Caterpillar Track | fieldmind.tech

**5 AI agents. Voice-first. Multilingual. Blockchain verified. Built for gloves-on field conditions.**

## Live Demo
→ https://fieldmind.tech
→ Cab Mode: https://fieldmind.tech/cab
→ Fleet: https://fieldmind.tech/fleet
→ Verify: https://fieldmind.tech/verify

## Prize Targets
- 🏆 Caterpillar — Best AI Inspection
- ⛓️ Solana — Best Use of Solana
- 💳 Capital One Nessie — Best Use of Nessie API
- ☁️ Cloudflare — Best Use of Cloudflare Developer Platform
- 🧠 Supermemory — Best Use of Supermemory
- 🎙️ ElevenLabs — Best Use of ElevenLabs
- 🌐 .Tech Domain — Best .Tech Domain
- 🚀 Aedify — Best Deployed on Aedify
- 🎨 Best UI/UX Design
- 🌍 Best Social Impact

## Stack
- Next.js 14 + TypeScript + Tailwind CSS + Framer Motion + Three.js
- Cloudflare Workers + D1 + R2 + KV
- OpenAI GPT-4o (via Worker only, never browser)
- ElevenLabs multilingual TTS
- Solana devnet — on-chain inspection verification
- Capital One Nessie — cost tracking API
- Supermemory — machine history memory
- wttr.in — live weather (no key needed)
- next-intl — EN/ES/PT/FR/ZH

## Setup (5 minutes)

### 1. Clone and install
```bash
git clone https://github.com/karansalot/FieldMind
cd FieldMind
npm install
```

### 2. Create .env.local

### 3. Generate Solana wallet
```bash
node -e "
  const { Keypair } = require('@solana/web3.js');
  const bs58 = require('bs58');
  const kp = Keypair.generate();
  console.log('PUBLIC KEY:', kp.publicKey.toString());
  console.log('PRIVATE KEY (secret):', bs58.encode(kp.secretKey));
"
```
Visit https://faucet.solana.com → paste PUBLIC KEY → get devnet SOL

### 4. Set Cloudflare resources
```bash
wrangler d1 create fieldmind-db
wrangler d1 execute fieldmind-db --file=worker/schema.sql
wrangler kv:namespace create fieldmind-kv
wrangler r2 bucket create fieldmind-photos
```
Update wrangler.toml with the IDs printed above.

### 5. Set secrets
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put SUPERMEMORY_API_KEY
wrangler secret put NESSIE_API_KEY
wrangler secret put SOLANA_PRIVATE_KEY
```

### 6. Deploy worker
```bash
wrangler deploy
```
Update .env.local: NEXT_PUBLIC_WORKER_URL=https://fieldmind-worker.YOUR.workers.dev

### 7. Seed demo data
```bash
npx ts-node scripts/seed-demo-data.ts
```

### 8. Run locally
```bash
npm run dev
```

### 9. Deploy frontend
```bash
# Push to GitHub → Vercel auto-deploys to fieldmind.tech
# OR: npx next build && npx aedify deploy
```

## Security check (run before demo)
```bash
grep -r "sk-proj-\|xi-api\|Bearer [a-z]" app/ components/ lib/ worker/ --include="*.ts" --include="*.tsx"
# Must return: zero results
```

## Demo Script (2 minutes for judges)

**Setup:** fieldmind.tech open on mobile, cold weather banner visible

1. **"It is 28°F outside. Inspector has gloves on."**
   - Open /cab
   - Hold the orange button → say "Start inspection on Cat 320"
   - No typing. No gloves off.

2. **"35% of construction workers speak Spanish."**
   - Tap 🌐 in header → switch to ES
   - Hold button → say "Iniciar inspección en Cat 320"
   - Full Spanish: UI, AI findings, PDF

3. **"Watch what happens when something is wrong."**
   - Go to /inspect → select Excavator 320
   - Take a photo of anything
   - Watch: red screen flash + strong haptic + voice alert in Spanish
   - "🛑 No operar esta máquina."

4. **"Every inspection is tamper-proof."**
   - Click "Verify on Blockchain"
   - Show Solana Explorer tx
   - Scan printed QR code → loads /verify page
   - "That is a real Solana devnet transaction."

5. **"Live at fieldmind.tech."**

## Fallbacks (if keys missing)
| Missing Key | Behavior |
|-------------|----------|
| ELEVENLABS_API_KEY | Browser speechSynthesis fallback |
| NESSIE_API_KEY | "Cost tracking disabled" banner |
| SOLANA_PRIVATE_KEY | Local hash verification only |
| OPENAI_API_KEY | Manual checklist mode, PDF still works |

## Architecture

Zero API keys in browser. Zero secrets in client code. Ever.
