'use client';

import {
  Building,
  Users,
  Home,
  FileText,
  Receipt,
  Settings,
  UserPlus,
  DollarSign,
  Printer,
  PlusCircle,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const HomePage = () => {
  const features = [
    {
      icon: <Building className="w-5 h-5" />,
      title: 'Property Management',
      description: 'Add and manage multiple properties. Organize units within each property and track occupancy.'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Tenant Management',
      description: 'Add tenants and roommates to specific units. Maintain full rental history per tenant.'
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      title: 'Rent Payment Records',
      description: 'Log and track all rent payments. Monitor arrears and payment status per unit.'
    },
    {
      icon: <PlusCircle className="w-5 h-5" />,
      title: 'Charge Management',
      description: 'Add custom charges for repairs, late fees, utilities, or any other cost. Set default amounts for quick entry.'
    },
    {
      icon: <Printer className="w-5 h-5" />,
      title: 'PDF Statements',
      description: 'Generate individual transaction receipts, unit-specific statements, and full property financial reports on demand.'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Business Settings',
      description: 'Configure business details, set default charge amounts, and customize system preferences.'
    }
  ];

  const workflow = [
    { step: '1', label: 'Add properties & units' },
    { step: '2', label: 'Assign tenants' },
    { step: '3', label: 'Track payments' },
    { step: '4', label: 'Generate statements' }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* ===== HERO ===== */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
              Rental management
              <br />
              <span className="text-blue-600">done right.</span>
            </h1>
            
            <p className="mt-4 text-lg text-gray-600 max-w-md leading-relaxed">
              Manage properties, tenants, rent payments, and charges in one place. Generate PDF statements for receipts, units, and entire properties.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors"
              >
                Get started
              </Link>
              <Link
                href="#features"
                className="px-6 py-2.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium rounded-md text-sm transition-colors"
              >
                See features
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Web-based
              </span>
              <span>•</span>
              <span>PDF reporting</span>
              <span>•</span>
              <span>Multi-property</span>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="bg-gray-900 rounded-lg p-5 text-gray-300 font-mono text-sm border border-gray-800">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="ml-2 text-gray-500">RentWise</span>
              </div>
              <div className="space-y-1.5 text-gray-300">
                <p><span className="text-blue-400">→</span> Unit B4 · Tenant: J. Mwangi</p>
                <p className="text-gray-500 text-xs pl-5">Rent: KES 25,000 · Paid: 12 May 2026</p>
                <p><span className="text-blue-400">→</span> Unit C2 · Tenant: A. Otieno</p>
                <p className="text-gray-500 text-xs pl-5">Rent: KES 18,000 · Pending</p>
                <p className="text-gray-600 text-xs mt-3 border-t border-gray-800 pt-3">Charges this month: KES 3,200</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== WORKFLOW ===== */}
      <section className="border-t border-gray-200 bg-gray-50/40">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">How it works</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Four steps, all rental records in one place</h2>
          </div>

          <div className="grid sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {workflow.map((w) => (
              <div key={w.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center mx-auto mb-3">
                  {w.step}
                </div>
                <p className="text-sm font-medium text-gray-800">{w.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Features</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">Everything you need to manage rentals</h2>
          <p className="text-gray-600 mt-3">Built for landlords and property managers who want clear records without the paperwork.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-5 bg-white hover:border-gray-300 transition-colors">
              <div className="text-blue-600 mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PDF STATEMENTS HIGHLIGHT ===== */}
      <section className="border-t border-gray-200 bg-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Reporting</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">PDF statements on demand</h2>
              <ul className="mt-4 space-y-2.5 text-gray-600 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-sm mt-0.5">→</span>
                  Individual transaction receipts for tenants
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-sm mt-0.5">→</span>
                  Unit-specific financial statements
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-sm mt-0.5">→</span>
                  Full property financial position reports
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">All generated instantly when you need them.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-gray-500 border-b border-gray-100 pb-4 mb-4">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Statement_Unit_B4_May2026.pdf</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="text-gray-400">Tenant:</span> Jane Doe</p>
                <p><span className="text-gray-400">Unit:</span> B4 · Rosewood Apartments</p>
                <p><span className="text-gray-400">Period:</span> May 2026</p>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-medium">
                  <span>Total paid:</span>
                  <span className="text-green-700">KES 25,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Charges:</span>
                  <span className="text-gray-600">KES 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CHARGES SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-b border-gray-200">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 border-b border-gray-100 pb-3 mb-3">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Charge entries</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600">Late fee (default)</span>
                  <span className="text-gray-800">KES 500</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600">Broken window repair</span>
                  <span className="text-gray-800">KES 1,200</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600">Water bill (default)</span>
                  <span className="text-gray-800">KES 1,800</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-600">General repairs</span>
                  <span className="text-gray-800">KES 2,500</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-2 text-xs text-gray-400">
                Default amounts can be customized in Settings
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Charges</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Track repairs, late fees, and more</h2>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              Add custom charges for any cost - broken windows, repairs, late fees, utilities. Set default amounts for quick entry and keep a clear record of all charges per unit.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Call to action ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Get your rental records in order</h2>
        <p className="text-gray-600 mt-3 max-w-lg mx-auto">
          Start managing properties, tenants, payments, and charges - all in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/auth/register"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors"
          >
            Create account
          </Link>
          <Link
            href="/contact"
            className="px-6 py-2.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium rounded-md text-sm transition-colors"
          >
            Contact sales
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 bg-gray-50/40 text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/rentwise_logo.jpeg"
                  alt="RentWise"
                  width={22}
                  height={22}
                  className="rounded"
                  unoptimized
                />
                <span className="font-semibold text-gray-800 text-sm">RentWise</span>
              </div>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Rental management platform for landlords and property managers.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="#features" className="hover:text-gray-700 transition-colors">Features</Link></li>
                <li><Link href="/changelog" className="hover:text-gray-700 transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Company</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="hover:text-gray-700 transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link></li>
                <li><Link href="/support" className="hover:text-gray-700 transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
            <span>© 2026 RentWise. All rights reserved.</span>
            <div className="flex gap-5">
              <Link href="/github" className="hover:text-gray-600 transition-colors">GitHub</Link>
              <Link href="/twitter" className="hover:text-gray-600 transition-colors">Twitter</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;