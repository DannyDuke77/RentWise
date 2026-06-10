'use client';

import { useState } from 'react';
import { 
  Building, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  Wrench, 
  BarChart3, 
  ArrowUpRight, 
  Check, 
  LayoutDashboard,
  Coins,
  History,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import CustomButton from '@/app/components/ui/CustomButton';
import Image from 'next/image';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'tenants' | 'maintenance'>('billing');

  const stats = [
    { label: 'Total Volume Tracked', value: 'KES 6.5B+' },
    { label: 'Active Managed Units', value: '12,500+' },
    { label: 'Automated Invoice Match', value: '94.2%' }
  ];

  const workflowTabs = {
    billing: {
      title: 'Automated Ledger & Payments',
      description: 'Ditch the manual receipts. RentWise automates tenant invoicing, parses mobile money or bank statements, and reconciles ledgers instantly.',
      features: ['M-Pesa Express & RTGS Bank integration', 'Automated utility penalty calculations', 'Real-time arrears aging analysis'],
      badge: 'Financial Core'
    },
    tenants: {
      title: 'Lifecycle Tenant Management',
      description: 'From onboarding documentation to digital checkout notices. Maintain a clear, unalterable historical ledger for every single unit.',
      features: ['Digital lease contract generation', 'Automated KYC & background verification', 'Direct tenant portal communication'],
      badge: 'CRM Framework'
    },
    maintenance: {
      title: 'SLA-Driven Maintenance Dispatch',
      description: 'Stop letting repair issues slip through the cracks. Track contractor response times, quote approvals, and tenant sign-offs.',
      features: ['Photo upload & diagnostic tagging', 'Automated work order routing', 'Vendor payout management system'],
      badge: 'Operations'
    }
  };

  const tiers = [
    {
      name: 'Standard Portfolio',
      price: 'KES 4,500',
      period: 'per month',
      desc: 'Optimized for self-managing landlords tracking up to 25 active units.',
      features: ['Automated M-Pesa tracking & ledger matching', 'Standard tenant SMS reminders', 'Basic digital lease document repository', 'Maintenance logging dashboard'],
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Professional Agency',
      price: 'KES 12,000',
      period: 'per month',
      desc: 'Engineered for dedicated property managers handling up to 150 units.',
      features: ['Everything in Standard tier included', 'Multi-level user access for caretakers', 'Automated utility sub-meter calculations', 'Direct external vendor dispatch routing', 'Custom monthly financial report exports'],
      cta: 'Upgrade to Pro',
      highlighted: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 antialiased selection:bg-blue-600 selection:text-white">

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-36 border-b border-gray-900 overflow-hidden">
        {/* Intricate technical background mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#fff_70%,transparent_100%)]"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Narrative Column */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                The analytical framework for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
                  Modern Property Operations.
                </span>
              </h1>
              
              <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                Stop guessing your net yield. RentWise unifies localized payment workflows, automated tenant tracking, and real-time portfolio health metrics into one high-performance dashboard.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/auth/register">
                  <CustomButton 
                    label="Deploy Free Trial"
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg text-base shadow-lg shadow-blue-500/10 transition-all"
                  />
                </Link>
                <Link href="#demo">
                  <CustomButton 
                    label="Explore Architecture"
                    className="px-6 py-3.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-medium rounded-lg text-base transition-colors"
                  />
                </Link>
              </div>

              {/* Minimal Tech Stack Validation */}
              <div className="pt-8 border-t border-gray-900 flex items-center gap-6 text-xs text-gray-500">
                <span className="font-mono uppercase tracking-wider text-gray-400">Core Engine:</span>
                <span>PostgreSQL Cloud</span>
                <span>•</span>
                <span>Bank-Grade Encryption</span>
                <span>•</span>
                <span>Instant Webhooks</span>
              </div>
            </div>

            {/* Right Rich Mockup Column */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none aspect-[1.4] rounded-2xl border border-gray-800 bg-gray-900/40 p-3 backdrop-blur-md shadow-2xl">
                
                {/* Simulated App Frame */}
                <div className="w-full h-full rounded-xl bg-gray-950 border border-gray-900 flex flex-col overflow-hidden text-xs">
                  {/* Internal Window Top Bar */}
                  <div className="bg-gray-900/60 border-b border-gray-900 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                      <span className="font-mono text-gray-400 font-medium">rentwise-prod // core-ledger</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-green-950/50 border border-green-900/60 text-green-400 font-mono text-[10px]">LIVE SYNC</span>
                  </div>

                  {/* Internal App Content Layout */}
                  <div className="p-4 flex-1 grid grid-cols-12 gap-4">
                    {/* Fake Sidebar */}
                    <div className="col-span-3 border-r border-gray-900/80 pr-2 space-y-2 text-gray-500">
                      <div className="p-2 rounded bg-gray-900 text-white flex items-center gap-2 font-medium"><LayoutDashboard className="w-3.5 h-3.5" /> Overview</div>
                      <div className="p-2 flex items-center gap-2"><Coins className="w-3.5 h-3.5" /> Collections</div>
                      <div className="p-2 flex items-center gap-2"><History className="w-3.5 h-3.5" /> Audit Logs</div>
                      <div className="p-2 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Documents</div>
                    </div>

                    {/* Fake Workspace Area */}
                    <div className="col-span-9 space-y-4">
                      {/* Metric widgets inside the frame */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-900">
                          <span className="text-gray-500 block text-[10px] uppercase">Collected (May)</span>
                          <span className="text-base font-bold text-white mt-1 block">KES 1.48M</span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-900">
                          <span className="text-gray-500 block text-[10px] uppercase">Outstanding Arrears</span>
                          <span className="text-base font-bold text-red-400 mt-1 block">KES 42,100</span>
                        </div>
                      </div>

                      {/* Fake Log Feed */}
                      <div className="border border-gray-900 rounded-lg overflow-hidden">
                        <div className="bg-gray-900/30 px-3 py-2 border-b border-gray-900 text-[10px] uppercase font-mono text-gray-400">Real-Time Transaction Stream</div>
                        <div className="p-2 divide-y divide-gray-900/50 font-mono text-[11px] space-y-1.5">
                          <div className="pt-1.5 flex justify-between text-gray-400">
                            <span>Unit B4 — Statement Match Success</span>
                            <span className="text-green-400">+55,000</span>
                          </div>
                          <div className="pt-1.5 flex justify-between text-gray-400">
                            <span>Unit A12 — Automated Invoice Generated</span>
                            <span className="text-gray-500">Pending</span>
                          </div>
                          <div className="pt-1.5 flex justify-between text-gray-400">
                            <span>Unit C2 — Automated SMS Reminder Queued</span>
                            <span className="text-amber-400">Sent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Tab-Based System Architecture Section */}
      <section id="architecture" className="py-24 border-b border-gray-900 bg-gray-900/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Granular Features</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              An application framework engineered for deep control.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Tab Controller Buttons */}
            <div className="lg:col-span-4 flex flex-col space-y-2">
              {(Object.keys(workflowTabs) as Array<keyof typeof workflowTabs>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`p-4 text-left rounded-xl border transition-all flex flex-col space-y-1 ${
                    activeTab === key 
                      ? 'bg-gray-900 border-gray-800 text-white shadow-md' 
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    {workflowTabs[key].badge}
                  </span>
                  <span className="font-semibold text-base">
                    {key === 'billing' ? 'Ledger Reconciliations' : key === 'tenants' ? 'Tenant Profiles' : 'Operations & Maintenance'}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Display Panel */}
            <div className="lg:col-span-8 p-8 bg-gray-900/30 border border-gray-900 rounded-2xl min-h-[320px] flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">{workflowTabs[activeTab].title}</h3>
                <p className="text-gray-400 leading-relaxed text-base">{workflowTabs[activeTab].description}</p>
                
                <ul className="space-y-3 pt-4">
                  {workflowTabs[activeTab].features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-blue-950 border border-blue-900/50 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 border-t border-gray-900/60 mt-8 flex items-center justify-between text-xs text-gray-500">
                <span>Enterprise API Extensible</span>
                <Link href="/auth/register" className="text-blue-400 hover:underline flex items-center gap-1 font-medium">
                  Initialize this module <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 lg:px-8 border-b border-gray-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Transparent Pricing</h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            Predictable billing scaled directly to your operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={index}
              className={`p-8 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                tier.highlighted 
                  ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-blue-500/40 shadow-xl' 
                  : 'bg-gray-900/20 border-gray-900'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-mono font-bold px-3 py-1 uppercase rounded-bl-lg tracking-wider">
                  Recommended
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{tier.desc}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{tier.price}</span>
                  <span className="text-xs text-gray-500">{tier.period}</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-gray-900">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                      <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <CustomButton 
                  label={tier.cta}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    tier.highlighted 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                      : 'bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Scaled Macro-Data Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mt-24 pt-12 border-t border-gray-900 text-center sm:text-left">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hard CTA Section */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to standardize your rental infrastructure?
        </h2>
        <p className="text-gray-400 text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Initialize your full 14-day sandboxed trial instance. Get full production capabilities right out of the box. No credit card activation steps required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register">
            <CustomButton 
              label="Initialize Framework"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors w-full sm:w-auto"
            />
          </Link>
          <Link href="/contact">
            <CustomButton 
              label="Speak with Systems Architect"
              className="px-6 py-3 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-semibold rounded-lg text-sm transition-colors w-full sm:w-auto"
            />
          </Link>
        </div>
      </section>

      {/* Structural Footer */}
      <footer className="bg-gray-950 border-t border-gray-900 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/rentwise_logo.jpeg"
                  alt="RentWise Logo"
                  width={24}
                  height={24}
                  className="rounded-md"
                  unoptimized
                />
                <span className="text-base font-bold text-white tracking-tight">RentWise</span>
              </div>
              <p className="text-gray-500 max-w-xs leading-relaxed">
                Automated asset operations, transaction tracking dashboards, and comprehensive compliance management systems for scale portfolios.
              </p>
            </div>

            <div>
              <h4 className="text-gray-300 font-bold mb-4 uppercase tracking-wider text-[10px]">Architecture</h4>
              <ul className="space-y-2.5">
                <li><Link href="#architecture" className="hover:text-gray-300 transition-colors">Core Modules</Link></li>
                <li><Link href="#pricing" className="hover:text-gray-300 transition-colors">Pricing Matrix</Link></li>
                <li><Link href="/integrations" className="hover:text-gray-300 transition-colors">API References</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-300 font-bold mb-4 uppercase tracking-wider text-[10px]">Company</h4>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="hover:text-gray-300 transition-colors">Our Ethos</Link></li>
                <li><Link href="/changelog" className="hover:text-gray-300 transition-colors">System Changelog</Link></li>
                <li><Link href="/contact" className="hover:text-gray-300 transition-colors">Support Line</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-300 font-bold mb-4 uppercase tracking-wider text-[10px]">Security</h4>
              <ul className="space-y-2.5">
                <li><Link href="/privacy" className="hover:text-gray-300 transition-colors">Data Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-300 transition-colors">Service Terms</Link></li>
                <li><Link href="/encryption" className="hover:text-gray-300 transition-colors">Cryptographic Standards</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-900 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-600">
            <div>© 2026 RentWise Operations Systems. All rights reserved.</div>
            <div className="flex gap-6">
              <Link href="/twitter" className="hover:text-gray-400 transition-colors">Twitter</Link>
              <Link href="/linkedin" className="hover:text-gray-400 transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;