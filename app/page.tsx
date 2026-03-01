'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWeather } from '@/contexts/WeatherContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const ParticleField = dynamic(() => import('@/components/three/ParticleField'), { ssr: false })

const AGENTS = [
  { icon: '🔍', name: 'Inspector Agent', desc: 'GO / CAUTION / NO-GO from photos and voice. GPT-4o Vision with field-optimized prompts.' },
  { icon: '🔩', name: 'Parts Agent', desc: 'Real CAT & JCB part numbers from photos. Visual identification with fitment certainty.' },
  { icon: '🛡️', name: 'Safety Agent', desc: 'Proactive hazard detection without asking. Lifting safety, weather-adjusted risk.' },
  { icon: '📋', name: 'Advisor Agent', desc: 'Work orders, maintenance plans, shift handoffs. Scheduled actions from inspection findings.' },
  { icon: '🧠', name: 'Memory Agent', desc: 'Machine history, failure prediction, trend analysis. Every machine remembers.' },
]

const FEATURES = [
  { icon: '❄️', title: 'Cold Weather', desc: '28°F on site? Voice mode means no gloves off. AI adjusts analysis for cold-weather risks.' },
  { icon: '🌍', title: 'Spanish Team', desc: 'Full Spanish UI. Spanish AI responses. Spanish voice output. Switch in one tap.' },
  { icon: '🏋️', title: 'Lifting Equipment', desc: 'CAT Telehandlers, JCB 3CX/4CX. AR pop-up on masts, forks, chains, SLI indicators.' },
  { icon: '📵', title: 'No Signal', desc: 'Underground, remote, dead zone? Offline mode captures everything. Syncs when back.' },
]

const STATS = [
  { value: '1,247', label: 'Injuries/day' },
  { value: '8 min', label: 'Avg inspection' },
  { value: '5', label: 'Languages' },
  { value: '∞', label: 'Blockchain records' },
]

export default function Home() {
  const { t } = useLanguage()
  const weather = useWeather()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 110 }}>
        <ParticleField />
        {/* Gradient radial overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(240,165,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 900, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', marginBottom: 32, fontSize: 13, fontWeight: 700, color: '#F0A500', letterSpacing: 1 }}>
            🏗️ {t('hero.badge')}
          </div>

          {/* H1 */}
          <h1 className="bebas" style={{ fontSize: 'clamp(56px, 12vw, 120px)', lineHeight: 0.9, marginBottom: 24, letterSpacing: 2 }}>
            <div style={{ color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>{t('hero.line1')}</div>
            <div>
              <span style={{ color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>{t('hero.line2a')} </span>
              <span className="gradient-text-animated">{t('hero.line2b')}</span>
            </div>
          </h1>

          <p style={{ fontSize: 20, color: 'var(--muted)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
            {t('hero.sub')}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/inspect" className="btn-brand" style={{ padding: '16px 36px', fontSize: 18, textDecoration: 'none', borderRadius: 14, display: 'inline-block' }}>
              {t('hero.cta')} →
            </Link>
            <Link href="/cab" className="btn-ghost" style={{ padding: '16px 36px', fontSize: 18, textDecoration: 'none', borderRadius: 14, display: 'inline-block' }}>
              🚗 Cab Mode
            </Link>
          </div>

          {/* Trust pills */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['⛓️ Solana Verified', '🌍 5 Languages', '❄️ Weather Aware', '🎙️ Voice First', '🧤 Glove Ready', '📵 Offline Mode', '🏋️ Lifting Safety', '🇧🇷 JCB + CAT'].map(p => (
              <span key={p} className="pill pill-brand">{p}</span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', color: 'var(--muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span>Scroll to explore</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--muted), transparent)' }} />
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '32px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div className="bebas" style={{ fontSize: 48, color: '#F0A500', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE WEATHER WIDGET */}
      {weather.loaded && !weather.error && (
        <section style={{ padding: '24px', background: weather.isFreezingCold ? 'rgba(96,165,250,0.05)' : weather.isVeryHot ? 'rgba(239,68,68,0.05)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>{weather.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{weather.temp}°F ({weather.tempC}°C) · {weather.condition} · {weather.city}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                {weather.isFreezingCold && '❄️ Cold Weather Protocol Active — Hydraulic seals at higher risk · '}
                {weather.isVeryHot && '☀️ Heat Advisory — Check coolant first · '}
                Wind {weather.windSpeed}mph · Humidity {weather.humidity}%
              </div>
            </div>
            <Link href="/weather" style={{ marginLeft: 'auto', color: '#F0A500', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Full forecast →</Link>
          </div>
        </section>
      )}

      {/* 5 AGENTS */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="pill pill-brand" style={{ marginBottom: 16 }}>AI AGENTS</div>
            <h2 className="bebas" style={{ fontSize: 'clamp(36px, 6vw, 64px)', letterSpacing: 1 }}>5 AI AGENTS. 1 UNIFIED PLATFORM.</h2>
            <p style={{ color: 'var(--muted)', maxWidth: 540, margin: '16px auto 0', fontSize: 17 }}>Each agent specializes. Together they cover every dimension of field inspection.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {AGENTS.map((a, i) => (
              <div key={i} className="glass glow-hover" style={{ padding: 28, borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{a.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{a.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR THE FIELD */}
      <section style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="bebas" style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: 1 }}>BUILT FOR THE FIELD. NOT THE OFFICE.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="glass glow-hover" style={{ padding: 32, borderRadius: 16, borderLeft: '3px solid rgba(240,165,0,0.3)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{f.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(240,165,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="bebas" style={{ fontSize: 'clamp(36px, 6vw, 72px)', marginBottom: 24 }}>READY TO INSPECT SMARTER?</h2>
          <p style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>Your first inspection takes 5 minutes. No training required.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/inspect" className="btn-brand" style={{ padding: '18px 48px', fontSize: 20, textDecoration: 'none', borderRadius: 16, display: 'inline-block' }}>Start Free Inspection →</Link>
            <Link href="/parts" className="btn-ghost" style={{ padding: '18px 32px', fontSize: 18, textDecoration: 'none', borderRadius: 16, display: 'inline-block' }}>Identify a Part</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
