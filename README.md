# 🚜 FieldMind — 2026 HackIllinois Submission

**The Next-Generation AI Powerhouse for Field Operations & Inspections**  
Built natively to solve the CAT Track Challenge: *Integrating CAT Inspect + CAT AI Assistant.*

## 🏆 Supported Tracks & Sponsors
1. **CAT**: Visual Parts Identification, Voice UI, Daily Walkaround, Site Logistics Planner.
2. **Cloudflare**: 100% of the backend runs on Cloudflare Workers and D1 Database.
3. **Solana**: Every finalized inspection report is securely hashed to the Devnet blockchain to prevent fraud.
4. **Capital One Nessie**: Critical machine failures trigger predictive API hooks for maintenance costs.
5. **Supermemory**: The AI remembers previous machine failure states across all sessions.
6. **.TECH Domains**: Optimized to be hosted instantly via Netlify on a .tech domain.

## 🚀 How to Run Locally

You need two terminals:

1. **Start the Frontend (Next.js)**
```bash
npm install
npm run dev
```

2. **Start the Backend (Cloudflare Worker & SQLite DB)**
```bash
cd worker
npm install
npx wrangler d1 execute fieldmind-db --local --file=./schema.sql
npx wrangler dev
```

## 🔑 Environment Variables
For the full demo to work perfectly, you need the following keys in your environments (Netlify frontend & Cloudflare `.dev.vars` / edge secrets):

**Frontend (`.env.local` / Netlify):**
- `NEXT_PUBLIC_OPENAI_KEY="your-key-here"` (Powers the Cab Mode Voice UI & Site Planner Maps)
- `NEXT_PUBLIC_WORKER_URL="http://localhost:8787"` (Points to your Cloudflare Worker URL in prod)

**Backend worker (Cloudflare `wrangler.toml` secrets):**
- `OPENAI_API_KEY` (Powers Parts Identification and Inspector)
- `ELEVENLABS_API_KEY` (Powers multilingual speech)
- `SOLANA_PRIVATE_KEY` (Powers DevNet verification)
- `NESSIE_API_KEY` (Powers expense routing)
- `SUPERMEMORY_API_KEY` (Powers historical tracking)

*FieldMind goes far beyond a simple text wrapper. It is a multimodal powerhouse built natively to revolutionize field operations.*
