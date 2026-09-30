import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Reusable Project Navbar in Landing Mode */}
      <Navbar isLanding={true} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-10 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              Property & Utility Management System
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.18] max-w-4xl mx-auto">
              Property Billing & Utility Management,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Automate meter readings, calculate electricity consumption, split utility charges, track tenant payments, generate PDF invoices, and send automated due-date reminders in one unified platform.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 sm:pt-4 max-w-sm sm:max-w-none mx-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-5 sm:py-6 text-sm sm:text-base rounded-xl shadow-md transition-all hover:scale-[1.01]">
                  Start Free Trial &rarr;
                </Button>
              </Link>

              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-5 sm:py-6 text-sm sm:text-base rounded-xl">
                  Explore Live Demo
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 sm:pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                Instant PDF Invoices
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                Automated Due Reminders
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                No Credit Card Required
              </div>
            </div>
          </div>
        </section>

        {/* Essential Core Features Section */}
        <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-gray-200/80">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Core Features
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Essential Property Billing Tools
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              Streamline multi-unit utility calculations, invoice distribution, and payment tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-5 sm:p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4">
                ⚡
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">Meter Calculation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Auto-calculate net kWh consumption from previous and current readings with custom rates per unit.
              </p>
            </Card>

            <Card className="p-5 sm:p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4">
                ⏰
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">Automated Reminders</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Daily scheduler generates due-tomorrow notifications and tracks overdue status automatically.
              </p>
            </Card>

            <Card className="p-5 sm:p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4">
                📄
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">Branded Invoices</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Generate formatted HTML and PDF invoices ready for instant download or emailing to tenants.
              </p>
            </Card>

            <Card className="p-5 sm:p-6 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4">
                📊
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">Financial Reports</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Filter billing history by month, status, or date range and export instant CSV spreadsheets.
              </p>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-gray-200/80">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">How PropertyBills Works</h2>
            <p className="text-gray-500 text-xs mt-1">Get up and running in 3 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="p-5 sm:p-6">
              <span className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2 sm:mb-3 block">01</span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Setup Properties & Units</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Add rental houses, flats, or commercial spaces along with base rent amounts and meter numbers.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2 sm:mb-3 block">02</span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Record Meter Readings</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Input monthly meter readings. The system automatically fetches previous readings and calculates consumption.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2 sm:mb-3 block">03</span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Generate & Track Bills</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                One-click invoice generation with PDF exports, receipt logging, and automated overdue tracking.
              </p>
            </Card>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-8 sm:p-12 text-center text-white shadow-md">
            <h2 className="text-xl sm:text-4xl font-bold mb-2 sm:mb-3 tracking-tight">
              Ready to Simplify Your Property Billing?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto mb-5 sm:mb-6">
              Join property managers automating utility meter billing and invoice tracking today.
            </p>
            <Link to="/register" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-700 hover:bg-gray-100 font-bold px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm rounded-xl shadow-md">
                Create Your Account Now &rarr;
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 py-6 sm:py-8 px-4 sm:px-6 bg-white text-gray-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">PropertyBills</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="w-full sm:w-auto">Property & Utility Management System</span>
          </div>
          <p>&copy; {new Date().getFullYear()} PropertyBills. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
