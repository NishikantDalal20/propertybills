import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Reports() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    propertyId: 'all',
    month: '',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsvRevenue, setDownloadingCsvRevenue] = useState(false);
  const [downloadingCsvBills, setDownloadingCsvBills] = useState(false);

  // Fetch Available Properties for Filter Dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/properties');
        setProperties(res.data || []);
      } catch (err) {
        console.error('Error loading properties for reports filter:', err);
      }
    };
    fetchProperties();
  }, []);

  // Fetch Report Live Preview Data whenever Filters change
  useEffect(() => {
    const fetchReportPreview = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {};
        if (filters.propertyId && filters.propertyId !== 'all') params.propertyId = filters.propertyId;
        if (filters.month) params.month = filters.month;
        if (filters.status && filters.status !== 'all') params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await api.get('/reports/preview', { params });
        setPreviewData(res.data);
      } catch (err) {
        console.error('Error fetching report preview:', err);
        setError(err.response?.data?.message || 'Failed to load report data preview');
      } finally {
        setLoading(false);
      }
    };

    fetchReportPreview();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      propertyId: 'all',
      month: '',
      status: 'all',
      startDate: '',
      endDate: '',
    });
    toast.success('Report filters reset');
  };

  // Helper for Export Actions (PDF / CSV)
  const handleExport = async (exportType) => {
    let endpoint = '';
    let defaultFilename = '';
    let setDownloading = null;

    if (exportType === 'pdf') {
      endpoint = '/reports/revenue-pdf';
      defaultFilename = filters.month ? `monthly-revenue-report-${filters.month}.pdf` : 'monthly-revenue-report.pdf';
      setDownloading = setDownloadingPdf;
    } else if (exportType === 'csv-revenue') {
      endpoint = '/reports/revenue-csv';
      defaultFilename = 'revenue-report.csv';
      setDownloading = setDownloadingCsvRevenue;
    } else if (exportType === 'csv-bills') {
      endpoint = '/reports/bills-csv';
      defaultFilename = 'bills-report.csv';
      setDownloading = setDownloadingCsvBills;
    }

    try {
      setDownloading(true);
      const params = {};
      if (filters.propertyId && filters.propertyId !== 'all') params.propertyId = filters.propertyId;
      if (filters.month) params.month = filters.month;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get(endpoint, {
        params,
        responseType: 'blob',
      });

      const mimeType = exportType === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${exportType.toUpperCase()} completed successfully`);
    } catch (err) {
      console.error(`Error exporting ${exportType}:`, err);
      toast.error('Failed to export report file');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (val) => `Rs. ${(Number(val) || 0).toLocaleString('en-IN')}`;

  const summary = previewData?.summary || {
    totalBills: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  };

  const billsList = previewData?.bills || [];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Financial Reports & Exports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate customizable PDF reports and Excel CSV exports with property, date range, and status filters.
            </p>
          </div>

          {/* Export Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={downloadingPdf}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-semibold shadow-sm"
            >
              📄 {downloadingPdf ? 'Generating PDF...' : 'Export PDF Report'}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport('csv-revenue')}
              disabled={downloadingCsvRevenue}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2 text-xs font-semibold"
            >
              📊 {downloadingCsvRevenue ? 'Exporting...' : 'Export CSV (Revenue)'}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport('csv-bills')}
              disabled={downloadingCsvBills}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2 text-xs font-semibold"
            >
              📋 {downloadingCsvBills ? 'Exporting...' : 'Export CSV (Bills)'}
            </Button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <Card className="mb-8 border-gray-200/80 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Filter Reports</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Select parameters to filter financial data previews and generated exports
                </CardDescription>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Property Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Property</label>
                <select
                  value={filters.propertyId}
                  onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Properties</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing Month</label>
                <input
                  type="month"
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Billed</span>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(summary.totalBilled)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.totalBills} bill(s) matched</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Revenue Paid</span>
                <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(summary.totalPaid)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.paidCount} paid invoice(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Outstanding Pending</span>
                <p className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(summary.totalPending)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.pendingCount} pending bill(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Overdue Invoices</span>
                <p className="text-2xl font-bold text-rose-600 mt-2">{summary.overdueCount}</p>
                <p className="text-xs text-gray-500 mt-1">Requiring tenant follow-up</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Live Filtered Bills Preview Table */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Filtered Records Preview</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Detailed listing of bills matching your active search criteria
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {billsList.length} Record(s)
            </span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : billsList.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <span className="text-4xl block mb-2">🔍</span>
                <p className="text-sm font-medium text-gray-600">No bills found for the selected filters</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your property, date range, or status filter.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Billing Month</th>
                    <th className="px-6 py-3">Property / Unit</th>
                    <th className="px-6 py-3">Tenant Name</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
                  {billsList.map((bill) => {
                    const invNum = bill.invoiceNumber || bill._id.slice(-6);
                    const propName = bill.unitId?.propertyId?.name || 'Property';
                    const unitNum = bill.unitId?.unitNumber ? `Unit ${bill.unitId.unitNumber}` : 'Unit';
                    const tenantName = bill.tenantId?.name || 'Valued Tenant';

                    return (
                      <tr key={bill._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-gray-900">#{invNum}</td>
                        <td className="px-6 py-3.5">{bill.month || 'N/A'}</td>
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-gray-900">{propName}</span>
                          <span className="text-gray-500 block text-[11px]">{unitNum}</span>
                        </td>
                        <td className="px-6 py-3.5 font-medium">{tenantName}</td>
                        <td className="px-6 py-3.5 font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              bill.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bill.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : bill.status === 'Partial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
