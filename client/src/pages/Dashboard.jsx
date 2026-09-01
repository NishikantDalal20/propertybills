import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const currentUser = user?.user || user || {};
  const displayName = currentUser?.name || 'Landlord';

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/properties/summary');
        setStats(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName}!</h1>
            <p className="text-blue-100 mt-2 max-w-md">
              Here is an overview of your rental properties and unit occupancies for today.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Overview Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-200/80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Properties</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">🏢</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-3">{stats?.totalProperties || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Managed locations</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Units</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-lg">🚪</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-3">{stats?.totalUnits || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Across all properties</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Occupied Units</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">🔑</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600 mt-3">{stats?.occupiedUnits || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Currently rented</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vacant Units</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">⚠️</span>
              </div>
              <p className="text-3xl font-bold text-amber-600 mt-3">{stats?.vacantUnits || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Ready for tenants</p>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Grid */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/properties" className="group">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  🏢
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Properties & Units</h3>
                <p className="text-xs text-gray-500 mt-1">Add new properties, view unit details, and configure monthly rental amounts.</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Manage Properties &rarr;
              </span>
            </div>
          </Link>

          <Link to="/tenants" className="group">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  👥
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Tenants Directory</h3>
                <p className="text-xs text-gray-500 mt-1">Register active tenants, assign them to vacant units, and update lease details.</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Tenants &rarr;
              </span>
            </div>
          </Link>

          <Link to="/readings" className="group">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Meter Readings</h3>
                <p className="text-xs text-gray-500 mt-1">Log monthly electric meter readings, calculate consumption, and generate bills.</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Record Readings &rarr;
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}