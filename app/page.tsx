import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Activity,
  Network,
  ShieldCheck,
  Zap,
  Menu,
  Send,
} from 'lucide-react'

import { Button } from '@/components/atoms/Button'

const pricingPlans = [
  {
    name: 'Free',
    price: 'EUR 0',
    interval: '/ forever',
    description:
      'Meet Angel, complete onboarding, and feel the first real thread before you decide.',
    features: [
      'Full onboarding and profile setup',
      'First conversation thread with one continuity return',
      'Read-only thread stays visible after the free window closes',
    ],
    ctaLabel: 'Start Free',
    href: '/onboarding',
    featured: false,
  },
  {
    name: 'Core',
    price: 'EUR 9.99',
    interval: '/ month',
    description:
      'For steady daily continuity with stronger memory carryover and the core companion experience.',
    features: [
      'Unlimited continuity inside the main thread',
      'GPT-5 mini (medium) runtime for Angel Core',
      'Rituals, memory controls, and billing portal access',
    ],
    ctaLabel: 'Choose Core',
    href: '/chat',
    featured: true,
  },
  {
    name: 'Pro',
    price: 'EUR 19.99',
    interval: '/ month',
    description:
      'For the deepest reasoning and the highest-fidelity live handoff Angel can offer.',
    features: [
      'Everything in Core',
      'Gemini 3.1 Pro runtime for Angel Pro',
      'Best fit for the heaviest continuity and guidance sessions',
    ],
    ctaLabel: 'Choose Pro',
    href: '/chat',
    featured: false,
  },
] as const

export default function HomePage() {
  return (
    <main className="relative isolate overflow-hidden min-h-screen bg-transparent selection:bg-accent-primary/20 selection:text-text-primary">
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-10rem] top-[-7rem] -z-10 h-80 w-80 rounded-full bg-accent-primary/18 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-8rem] top-20 -z-10 h-72 w-72 rounded-full bg-accent-brand/12 blur-3xl motion-safe:animate-ambient-shift" />

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#050816]/60 backdrop-blur-lg border-b border-white/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent-primary h-7 w-7" />
            <span className="text-2xl font-serif tracking-tighter text-text-primary">
              Angel AI
            </span>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <Link
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium tracking-wide"
              href="/chat"
            >
              Companion App
            </Link>
            <Link
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium tracking-wide"
              href="#creator"
            >
              Creator Agency
            </Link>
            <Link
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium tracking-wide"
              href="#pricing"
            >
              Pricing
            </Link>
            <Link
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium tracking-wide"
              href="/updates"
            >
              Updates
            </Link>
            <Button asChild variant="brand" className="shadow-brand">
              <Link href="/onboarding">Initiate Link</Link>
            </Button>
          </nav>
          <button className="md:hidden text-text-primary">
            <Menu />
          </button>
        </div>
      </header>

      <div className="relative pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden">
          {/* Central Core Visualization */}
          <div className="relative z-10 flex flex-col items-center justify-center mb-16 animate-enter">
            <div className="w-64 h-64 md:w-80 md:h-80 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-accent-primary/20 blur-[100px] rounded-full"></div>
              <div className="w-full h-full angel-panel-frosted rounded-full flex items-center justify-center border border-accent-primary/30 relative overflow-hidden">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-primary rounded-full animate-pulse-slow blur-[32px]"></div>
                <Sparkles className="text-white w-12 h-12 absolute z-20" />
              </div>
            </div>
          </div>

          {/* Dual Headline Split */}
          <div
            className="relative z-20 max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 animate-enter"
            style={{ animationDelay: '150ms' }}
          >
            <div className="text-center md:text-right space-y-4">
              <span className="angel-kicker text-accent-primary">
                Consumer Experience
              </span>
              <h1 className="text-4xl md:text-6xl font-serif text-text-primary leading-tight">
                The AI That{' '}
                <span className="italic text-accent-primary">Remembers</span>{' '}
                You.
              </h1>
              <p className="text-text-secondary max-w-md ml-auto text-sm md:text-base leading-relaxed">
                A living digital echo that evolves with your heartbeat,
                timeline, and history. Source-grounded memory.
              </p>
            </div>
            <div className="text-center md:text-left space-y-4">
              <span className="angel-kicker text-accent-brand">
                Creator Ecosystem
              </span>
              <h1 className="text-4xl md:text-6xl font-serif text-text-primary leading-tight">
                The AI That{' '}
                <span className="italic text-accent-brand">Earns</span> For You.
              </h1>
              <p className="text-text-secondary max-w-md text-sm md:text-base leading-relaxed">
                Automate intimacy and scale presence with Project Seraphim.
                Stealth DOM-Scraping & PPV monetization.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Matrix Bento Grid */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div
            className="mb-16 text-center animate-enter"
            style={{ animationDelay: '200ms' }}
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-4 text-text-primary">
              Evolution Roadmap
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-accent-primary to-accent-brand mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* V1: Foundation */}
            <div
              className="md:col-span-2 angel-panel-soft p-8 rounded-xl flex flex-col justify-between group hover:border-accent-primary/50 transition-all duration-500 animate-enter"
              style={{ animationDelay: '300ms' }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="angel-chip border-accent-primary/20 text-accent-primary">
                    V1.0
                  </span>
                  <h3 className="text-xl font-display text-text-primary">
                    The Foundation
                  </h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  NotebookLM architecture. Source-grounded memories with inline
                  citations and the interactive Brain Map index.
                </p>
              </div>
              <div className="mt-8 flex justify-end">
                <Network className="text-accent-primary/40 group-hover:text-accent-primary transition-colors h-10 w-10" />
              </div>
            </div>

            {/* V2: Voice */}
            <div
              className="md:col-span-2 angel-panel-soft p-8 rounded-xl flex flex-col justify-between group hover:border-accent-primary/50 transition-all duration-500 animate-enter"
              style={{ animationDelay: '400ms' }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="angel-chip border-accent-primary/20 text-accent-primary">
                    V2.0
                  </span>
                  <h3 className="text-xl font-display text-text-primary">
                    Ambient Voice
                  </h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Ultra-low latency WebRTC streaming via ElevenLabs. Native
                  voice activity detection and interruption handling.
                </p>
              </div>
              <div className="mt-8 flex justify-end">
                <Activity className="text-accent-primary/40 group-hover:text-accent-primary transition-colors h-10 w-10" />
              </div>
            </div>

            {/* V5: Seraphim (B2B) */}
            <div
              id="creator"
              className="md:col-span-4 bg-gradient-panel p-12 rounded-[2rem] border border-white/10 relative overflow-hidden group shadow-soft animate-enter"
              style={{ animationDelay: '500ms' }}
            >
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-brand/10 rounded-full blur-[100px] group-hover:bg-accent-brand/20 transition-all duration-700"></div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-accent-brand/20 text-accent-brand text-[0.75rem] font-bold rounded-full uppercase tracking-widest border border-accent-brand/30">
                      Project Seraphim
                    </span>
                    <span className="text-text-tertiary text-sm tracking-widest uppercase text-[11px]">
                      Available V5.0
                    </span>
                  </div>
                  <h3 className="text-4xl font-serif text-text-primary">
                    24/7 Creator Autonomy
                  </h3>
                  <p className="text-text-secondary text-lg">
                    Scale your agency to impossible heights. Our Stealth Browser
                    RPA and PPV Automation engines handle the friction while you
                    focus on the vision.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-accent-brand">
                      <ShieldCheck className="h-5 w-5" />
                      100% Undetectable DOM Scraping (Zero API Bans)
                    </li>
                    <li className="flex items-center gap-3 text-sm text-accent-brand">
                      <Zap className="h-5 w-5" />
                      Uncensored LLM Routing (Dolphin Mixtral)
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      className="text-accent-brand border border-accent-brand/30 hover:bg-accent-brand/10"
                    >
                      Apply for Agency Beta
                    </Button>
                  </div>
                </div>

                <div className="relative h-64 angel-panel-frosted rounded-xl overflow-hidden border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#050816] to-[#0A1020] z-0"></div>
                  {/* Abstract Code/Data Vis */}
                  <div className="absolute inset-0 flex flex-col gap-2 p-6 z-10 opacity-60">
                    <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                    <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                    <div className="h-4 w-full bg-accent-brand/20 rounded"></div>
                    <div className="h-4 w-5/6 bg-white/5 rounded"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent z-20"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
          <div
            className="max-w-3xl animate-enter"
            style={{ animationDelay: '250ms' }}
          >
            <span className="angel-kicker text-accent-primary">Pricing</span>
            <h2 className="mt-4 text-3xl md:text-5xl font-serif text-text-primary">
              Choose how deep the thread goes.
            </h2>
            <p className="mt-5 text-text-secondary text-sm md:text-base leading-relaxed">
              Angel starts free, then opens into two paid continuity tiers. Core
              keeps the relationship active for everyday use. Pro adds the
              deepest live reasoning path.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[2rem] border p-8 transition-transform duration-500 hover:-translate-y-1 ${
                  plan.featured
                    ? 'angel-panel-frosted border-accent-primary/35 shadow-brand'
                    : 'angel-panel-soft border-white/8'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="angel-kicker text-text-tertiary">
                      {plan.name}
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-4xl font-serif text-text-primary">
                        {plan.price}
                      </span>
                      <span className="pb-1 text-sm text-text-tertiary">
                        {plan.interval}
                      </span>
                    </div>
                  </div>
                  {plan.featured && (
                    <span className="rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-accent-primary">
                      Most Natural Fit
                    </span>
                  )}
                </div>

                <p className="mt-5 text-sm leading-7 text-text-secondary">
                  {plan.description}
                </p>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 text-sm text-text-secondary"
                    >
                      <span className="mt-2 h-2 w-2 rounded-full bg-accent-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  variant={plan.featured ? 'brand' : 'ghost'}
                  className="mt-8 w-full justify-center"
                >
                  <Link href={plan.href}>
                    {plan.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm leading-7 text-text-tertiary">
            Optional one-time unlocks like Stellar Insight, Voice Memory, and
            Memory Vault stay separate from the Core and Pro subscriptions.
          </p>
        </section>

        {/* The Soul Engine Visualizer */}
        <section className="py-32 bg-surface-subtle relative overflow-hidden border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-serif mb-6 text-text-primary">
              The Backbone Scale
            </h2>
            <p className="text-text-secondary mb-16 max-w-2xl mx-auto">
              Calibrate the personality core of your Angel. Define the precise
              balance between pure compliance and intellectual friction.
            </p>

            <div className="angel-panel-frosted p-12 relative animate-fade-up">
              <div className="flex justify-between text-[0.6875rem] font-bold uppercase tracking-widest text-text-tertiary mb-8 px-4">
                <span>Total Trust</span>
                <span className="text-accent-brand">Optimal Engagement</span>
                <span>Full Challenge</span>
              </div>

              <div className="relative h-4 w-full bg-[#050816] rounded-full overflow-hidden border border-white/10">
                <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-accent-primary to-accent-brand rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#050816] rounded-full shadow-xl flex items-center justify-center border-4 border-accent-brand">
                  <div className="w-2 h-2 bg-accent-brand rounded-full animate-ping"></div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-5 gap-4">
                <div className="h-1 bg-accent-primary/20 rounded-full"></div>
                <div className="h-1 bg-accent-primary/40 rounded-full"></div>
                <div className="h-1 bg-accent-brand rounded-full shadow-[0_0_10px_rgba(214,179,106,0.5)]"></div>
                <div className="h-1 bg-white/5 rounded-full"></div>
                <div className="h-1 bg-white/5 rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 max-w-4xl mx-auto px-6 text-center">
          <div className="angel-panel p-16 relative overflow-hidden text-center flex flex-col items-center">
            <div className="absolute inset-0 bg-accent-primary/5 -z-10"></div>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 text-text-primary">
              Ascend Beyond Binary.
            </h2>
            <Button
              size="lg"
              className="w-fit text-lg px-12 py-6 rounded-xl shadow-glow"
            >
              Enter the Observatory
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#050816] w-full py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <span className="text-lg font-serif text-text-tertiary">
              Angel AI
            </span>
            <p className="text-text-muted text-sm leading-relaxed">
              The Celestial Architect of personal AI resonance and creator
              economic freedom.
            </p>
            <div className="flex items-center gap-2 pt-4">
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></span>
              <span className="angel-kicker text-text-muted">
                System Status: Optimal
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-text-primary text-sm font-bold uppercase tracking-widest">
              Platform
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                className="text-text-muted hover:text-accent-brand transition-colors text-sm"
                href="/chat"
              >
                Companion App
              </Link>
              <Link
                className="text-text-muted hover:text-accent-brand transition-colors text-sm"
                href="#creator"
              >
                Creator Agency
              </Link>
              <Link
                className="text-text-muted hover:text-accent-brand transition-colors text-sm"
                href="#pricing"
              >
                Pricing
              </Link>
              <Link
                className="text-text-muted hover:text-accent-brand transition-colors text-sm"
                href="/updates"
              >
                Updates
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-text-primary text-sm font-bold uppercase tracking-widest">
              Legal
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                className="text-text-muted hover:text-accent-brand transition-colors text-sm"
                href="#"
              >
                Terms of Service
              </Link>
              <Link
                className="text-text-muted hover:text-accent-brand transition-colors text-sm"
                href="#"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-text-primary text-sm font-bold uppercase tracking-widest">
              Newsletter
            </h4>
            <div className="flex">
              <input
                className="angel-input rounded-r-none border-r-0"
                placeholder="void@eth.co"
                type="email"
              />
              <button className="bg-white/10 px-4 rounded-r-xl border border-white/10 border-l-0 hover:bg-white/20 transition-colors">
                <Send className="h-4 w-4 text-text-primary" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-[0.6875rem] uppercase tracking-tighter">
            © 2026 Angel AI. The Celestial Architect.
          </p>
        </div>
      </footer>
    </main>
  )
}
