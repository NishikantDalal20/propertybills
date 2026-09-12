import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS = {
  Paid: '#10b981',    // Emerald
  Pending: '#f59e0b', // Amber
  Partial: '#3b82f6', // Blue
  Overdue: '#ef4444', // Red
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(true);

  const [summaryError, setSummaryError] = useState('');
  const [revenueError, setRevenueError] = useState('');
  const [paymentStatusError, setPaymentStatusError] = useState('');

  const { user } = useAuth();
  const currentUser = user?.user || user || {};
  const displayName = currentUser?.name || 'Landlord';

  useEffect(() => {
    // 1. Fetch Property Summary Stats
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await api.get('/properties/summary');
        setStats(res.data);
        setSummaryError('');
      } catch (err) {
        setSummaryError(err.response?.data?.message || 'Failed to fetch dashboard summary');
      } finally {
        setSummaryLoading(false);
      }
    };

    // 2. Fetch Monthly Revenue Analytics
    const fetchRevenue = async () => {
      try {
        setRevenueLoading(true);
        const res = await api.get('/stats/revenue-by-month');
        setRevenueData(res.data || []);
        setRevenueError('');
      } catch (err) {
        setRevenueError(err.response?.data?.message || 'Failed to fetch revenue analytics');
      } finally {
        setRevenueLoading(false);
      }
    };

    // 3. Fetch Payment Status Distribution
    const fetchPaymentStatus = async () => {
      try {
        setPaymentStatusLoading(true);
        const res = await api.get('/stats/payment-status');
        setPaymentStatusData(res.data || []);
        setPaymentStatusError('');
      } catch (err) {
        setPaymentStatusError(err.response?.data?.message || 'Failed to fetch payment status distribution');
      } finally {
        setPaymentStatusLoading(false);
      }
    };

    fetchSummary();
    fetchRevenue();
    fetchPaymentStatus();
  }, []);

  // Formatted data for Recharts visualization
  const formattedRevenue = (revenueData || []).map((item) => ({
    month: item._id || item.month || 'N/A',
    revenue: Number(item.revenue || item.total || 0),
  }));

  const formattedPaymentStatus = (paymentStatusData || []).map((item, index) => {
    const statusName = item._id || item.status || 'Unknown';
    return {
      name: statusName,
      value: Number(item.count || item.total || 0),
      color: STATUS_COLORS[statusName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
  });

  const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString()}`;

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
              Here is an overview of your rental properties, revenue trends, and payment status distribution.
            </p>
          </div>
        </div>

        {/* Global Summary Error Alert */}
        {summaryError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{summaryError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Overview Grid */}
        {summaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Properties</span>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">🏢</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-3">{stats?.totalProperties || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Managed locations</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Units</span>
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-lg">🚪</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-3">{stats?.totalUnits || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Across all properties</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Occupied Units</span>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">🔑</span>
                </div>
                <p className="text-3xl font-bold text-emerald-600 mt-3">{stats?.occupiedUnits || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Currently rented</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vacant Units</span>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">⚠️</span>
                </div>
                <p className="text-3xl font-bold text-amber-600 mt-3">{stats?.vacantUnits || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Ready for tenants</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Over Time Line Chart */}
          <Card className="hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-base font-bold text-gray-900">Revenue Over Time</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Monthly revenue generated from paid tenant bills
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {revenueLoading ? (
                <Skeleton className="h-[300px] w-full rounded-xl" />
              ) : revenueError ? (
                <div className="h-[300px] flex items-center justify-center bg-red-50/50 rounded-xl border border-red-100 p-4">
                  <p className="text-sm text-red-600 font-medium">{revenueError}</p>
                </div>
              ) : formattedRevenue.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50">
                  <span className="text-3xl mb-2">📈</span>
                  <p className="text-sm font-medium text-gray-600">No revenue data recorded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Paid bills will automatically populate monthly revenue trends.</p>
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Revenue']}
                        labelFormatter={(lbl) => `Month: ${lbl}`}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#1d4ed8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status Distribution Pie/Donut Chart */}
          <Card className="hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-base font-bold text-gray-900">Payment Status</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Breakdown of bills grouped by payment status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {paymentStatusLoading ? (
                <Skeleton className="h-[300px] w-full rounded-xl" />
              ) : paymentStatusError ? (
                <div className="h-[300px] flex items-center justify-center bg-red-50/50 rounded-xl border border-red-100 p-4">
                  <p className="text-sm text-red-600 font-medium">{paymentStatusError}</p>
                </div>
              ) : formattedPaymentStatus.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50">
                  <span className="text-3xl mb-2">🍩</span>
                  <p className="text-sm font-medium text-gray-600">No payment status data recorded</p>
                  <p className="text-xs text-gray-400 mt-1">Generated bills will be categorized by status here.</p>
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedPaymentStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {formattedPaymentStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} bill(s)`, name]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs text-gray-600 font-medium">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Navigation Grid */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/properties" className="group">
            <Card className="p-6 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  🏢
                </div>
                <CardTitle className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Properties & Units</CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">Add new properties, view unit details, and configure monthly rental amounts.</CardDescription>
              </div>
              <span className="text-xs font-semibold text-blue-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Manage Properties &rarr;
              </span>
            </Card>
          </Link>

          <Link to="/tenants" className="group">
            <Card className="p-6 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  👥
                </div>
                <CardTitle className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Tenants Directory</CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">Register active tenants, assign them to vacant units, and update lease details.</CardDescription>
              </div>
              <span className="text-xs font-semibold text-emerald-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Tenants &rarr;
              </span>
            </Card>
          </Link>

          <Link to="/readings" className="group">
            <Card className="p-6 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <CardTitle className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Meter Readings</CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">Log monthly electric meter readings, calculate consumption, and generate bills.</CardDescription>
              </div>
              <span className="text-xs font-semibold text-indigo-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Record Readings &rarr;
              </span>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}