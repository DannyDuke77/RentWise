'use client';

import {
  Building,
  Users,
  DollarSign,
  Printer,
  PlusCircle,
  UserPlus,
  FileText,
  ClipboardList,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const HomePage = () => {
  const features = [
    {
      icon: <Building className="w-5 h-5" />,
      accent: 'text-blue-600 bg-blue-50',
      title: 'Properties & units',
      description: 'Organize every property into units, track occupancy, and see which units are vacant at a glance.',
    },
    {
      icon: <Users className="w-5 h-5" />,
      accent: 'text-blue-600 bg-blue-50',
      title: 'A portal for each tenant',
      description: 'Tenants get their own login to check what they owe, review past payments, and pay rent, without calling the office.',
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      accent: 'text-emerald-600 bg-emerald-50',
      title: 'M-Pesa rent collection',
      description: 'Rent is paid by M-Pesa STK Push, straight from the tenant\'s phone. Payments post the moment M-Pesa confirms them.',
    },
    {
      icon: <PlusCircle className="w-5 h-5" />,
      accent: 'text-amber-600 bg-amber-50',
      title: 'Charges beyond rent',
      description: 'Bill for repairs, late fees, or utilities as they come up, with default amounts so entry only takes a click.',
    },
    {
      icon: <Printer className="w-5 h-5" />,
      accent: 'text-blue-600 bg-blue-50',
      title: 'Statements & receipts',
      description: 'Produce a tenant receipt, a unit statement, or a full property report as a PDF, whenever you need one.',
    },
    {
      icon: <UserPlus className="w-5 h-5" />,
      accent: 'text-blue-600 bg-blue-50',
      title: 'Team access',
      description: 'Bring in a manager or caretaker with their own login, scoped to what they should be able to see and do.',
    },
  ];

  const workflow = [
    { step: '1', label: 'Add properties & units' },
    { step: '2', label: 'Invite tenants' },
    { step: '3', label: 'Tenant pays by M-Pesa' },
    { step: '4', label: 'Payment posts on its own' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ===== HERO ===== */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Rent that pays itself in,
              <br />
              not rent you chase down.
            </h1>

            <p className="mt-5 text-lg text-slate-600 max-w-md leading-relaxed">
              Landlords manage properties, tenants, and charges from one dashboard. Tenants pay rent by M-Pesa from their phone, and the payment shows up on its own - no receipts to log by hand.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors"
              >
                Create a landlord account
              </Link>
              <Link
                href="#features"
                className="px-6 py-2.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-medium rounded-md text-sm transition-colors"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {['M-Pesa payments', 'Multi-property', 'Tenant self-service'].map((tag) => (
                <span key={tag} className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Phone mockup: the actual M-Pesa STK Push moment */}
          <div className="flex justify-center md:justify-end">
            <div className="w-[280px] rounded-[2rem] border border-slate-200 bg-slate-900 p-3 shadow-xl">
              <div className="rounded-[1.5rem] bg-white overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[10px] text-slate-400">
                  <span>9:41</span>
                  <span>M-PESA</span>
                </div>
                <div className="px-4 pb-5 pt-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Image src="/M-PESA.png" alt="M-Pesa" width={28} height={28} className="rounded" unoptimized />
                    <span className="text-xs font-semibold text-slate-700">Lipa Na M-Pesa</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Confirm you want to pay
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">KES 25,000.00</p>
                  <p className="text-xs text-slate-500 mt-1">to Rosewood Apartments</p>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[11px] text-slate-400 mb-2">Enter M-Pesa PIN to confirm</p>
                    <div className="flex gap-2 mb-4">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="w-7 h-8 rounded border border-slate-200 bg-slate-50" />
                      ))}
                    </div>
                    <button className="w-full py-2 rounded-md bg-emerald-600 text-white text-sm font-medium animate-pulse">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== WORKFLOW ===== */}
      <section className="border-t border-slate-200 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center">From vacant unit to paid rent, in four steps</h2>

          <div className="grid sm:grid-cols-4 gap-6 max-w-3xl mx-auto mt-10">
            {workflow.map((w) => (
              <div key={w.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center mx-auto mb-3">
                  {w.step}
                </div>
                <p className="text-sm font-medium text-slate-800">{w.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl font-bold text-slate-900">Everything a rental business needs to run day to day</h2>
          <p className="text-slate-600 mt-3">Built for landlords and property managers who want clear records without the paperwork.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-md p-5 bg-white hover:border-slate-300 transition-colors">
              <div className={`inline-flex p-2 rounded-md mb-3 ${f.accent}`}>{f.icon}</div>
              <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== M-PESA PAYMENTS HIGHLIGHT ===== */}
      <section className="border-t border-slate-200 bg-emerald-50/40">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Rent collection, without the follow-up calls</h2>
              <ul className="mt-4 space-y-3 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  A tenant taps "Pay rent" in their portal
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Their phone gets an M-Pesa prompt right away
                </li>
                <li className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  The payment is recorded the moment M-Pesa confirms it
                </li>
              </ul>
              <p className="mt-4 text-sm text-slate-500">No manual reconciliation, no chasing down a receipt.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-500 border-b border-slate-100 pb-4 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-700">Payment confirmed</span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="text-slate-400">Tenant:</span> J. Mwangi</p>
                <p><span className="text-slate-400">Unit:</span> B4 &middot; Rosewood Apartments</p>
                <p><span className="text-slate-400">Method:</span> M-Pesa</p>
                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-medium">
                  <span>Amount received:</span>
                  <span className="text-emerald-700">KES 25,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CHARGES SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-b border-slate-200">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-white border border-slate-200 rounded-md p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-100 pb-3 mb-3">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-slate-700">Charge entries</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Late fee (default)</span>
                  <span className="text-slate-800">KES 500</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Broken window repair</span>
                  <span className="text-slate-800">KES 1,200</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Water bill (default)</span>
                  <span className="text-slate-800">KES 1,800</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">General repairs</span>
                  <span className="text-slate-800">KES 2,500</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-2 text-xs text-slate-400">
                Default amounts can be changed anytime in settings
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-bold text-slate-900">Charges beyond rent, tracked the same way</h2>
            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              Bill a repair, a late fee, or a utility as soon as it happens. Set a default amount for the ones that repeat, and every charge lands on the tenant's record next to their rent.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Call to action ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Bring your rent roll online</h2>
        <p className="text-slate-600 mt-3 max-w-lg mx-auto">
          Set up your first property, invite your tenants, and let M-Pesa handle collection.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/auth/register"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors"
          >
            Create account
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 bg-slate-50/60 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/RentWise_logo.png"
              alt="RentWise"
              width={22}
              height={22}
              className="rounded"
              unoptimized
            />
            <span className="font-semibold text-slate-800 text-sm">RentWise</span>
            <span className="text-slate-400 hidden sm:inline">Rental management for landlords and property managers</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="#features" className="hover:text-slate-700 transition-colors">Features</Link>
            <span>&copy; 2026 RentWise</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;