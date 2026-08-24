import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_UNITS = 'http://localhost:5000/api/units';
const API_READINGS = 'http://localhost:5000/api/readings';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function MeterReadings() {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${m}`;
  });
  const [previousReading, setPreviousReading] = useState(0);
  const [currentReading, setCurrentReading] = useState('');
  const [readingsHistory, setReadingsHistory] = useState([]);
  
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [fetchingPrevious, setFetchingPrevious] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch all units on mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoadingUnits(true);
        const res = await axios.get(API_UNITS, authHeader());
        setUnits(res.data);
        if (res.data.length > 0) {
          setSelectedUnitId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch units:', err);
        setError(err.response?.data?.message || 'Failed to load rental units');
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  // Fetch readings history and auto-fetch previous reading when selectedUnitId changes
  useEffect(() => {
    if (!selectedUnitId) {
      setReadingsHistory([]);
      setPreviousReading(0);
      return;
    }

    const fetchUnitReadings = async () => {
      try {
        setFetchingPrevious(true);
        const res = await axios.get(`${API_READINGS}/unit/${selectedUnitId}`, authHeader());
        const readings = res.data;
        setReadingsHistory(readings);

        if (readings && readings.length > 0) {
          // Latest reading is first element due to sort({ month: -1 })
          const latestReading = readings[0];
          setPreviousReading(latestReading.currentReading);
        } else {
          setPreviousReading(0);
        }
      } catch (err) {
        console.error('Failed to fetch unit readings:', err);
        setReadingsHistory([]);
        setPreviousReading(0);
      } finally {
        setFetchingPrevious(false);
      }
    };

    fetchUnitReadings();
  }, [selectedUnitId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const calculatedConsumption = () => {
    if (currentReading === '' || isNaN(Number(currentReading))) return null;
    return Number(currentReading) - Number(previousReading);
  };

  const consumption = calculatedConsumption();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUnitId) {
      setError('Please select a rental unit');
      return;
    }

    if (!month) {
      setError('Please select a billing month');
      return;
    }

    if (currentReading === '') {
      setError('Please enter the current meter reading');
      return;
    }

    const currNum = Number(currentReading);
    const prevNum = Number(previousReading);

    if (isNaN(currNum) || isNaN(prevNum)) {
      setError('Readings must be valid numbers');
      return;
    }

    if (currNum < prevNum) {
      setError(`Current reading (${currNum}) cannot be less than previous reading (${prevNum})`);
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(API_READINGS, {
        unitId: selectedUnitId,
        month,
        previousReading: prevNum,
        currentReading: currNum
      }, authHeader());

      triggerToast('Meter reading recorded successfully!', 'success');
      setCurrentReading('');
      
      // Refresh readings history & auto update previous reading
      const res = await axios.get(`${API_READINGS}/unit/${selectedUnitId}`, authHeader());
      setReadingsHistory(res.data);
      if (res.data && res.data.length > 0) {
        setPreviousReading(res.data[0].currentReading);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to save meter reading';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUnit = units.find(u => u._id === selectedUnitId);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/5' 
            : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/5'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {toast.message}
          </div>
        </div>
      )}

      {/* Top Header / Navigation */}
      <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              PropertyBills
            </span>
            <div className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                Dashboard
              </Link>
              <Link to="/properties" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                Properties
              </Link>
              <Link to="/tenants" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                Tenants
              </Link>
              <Link to="/readings" className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-600 transition-all">
                Meter Readings
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">{user.name || 'Landlord'}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meter Readings</h1>
            <p className="text-sm text-gray-500 mt-1">Record utility meter readings and track consumption per unit.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-4">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Entry Form Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                New Meter Reading
              </h2>

              {loadingUnits ? (
                <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
                  Loading rental units...
                </div>
              ) : units.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-3">No rental units found.</p>
                  <Link
                    to="/properties"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Add Property & Units
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Select Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Rental Unit <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    >
                      {units.map((unit) => {
                        const propName = unit.propertyId?.name || 'Property';
                        return (
                          <option key={unit._id} value={unit._id}>
                            {propName} - Unit {unit.unitNumber}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Billing Month */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Billing Month <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>

                  {/* Previous Reading (Auto-Fetched) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Previous Reading
                      </label>
                      <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                        {fetchingPrevious ? 'Fetching...' : 'Auto-Fetched'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={previousReading}
                      onChange={(e) => setPreviousReading(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-100/80 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Auto-populated from the latest recorded reading for this unit.
                    </p>
                  </div>

                  {/* Current Reading */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Current Reading <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={currentReading}
                      onChange={(e) => setCurrentReading(e.target.value)}
                      placeholder="Enter current meter reading"
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>

                  {/* Consumption Highlight Card */}
                  {consumption !== null && (
                    <div className={`p-4 rounded-xl border transition-all ${
                      consumption < 0 
                        ? 'bg-rose-50 border-rose-200 text-rose-800' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                            Calculated Consumption
                          </span>
                          <span className="text-2xl font-black tracking-tight mt-0.5 block">
                            {consumption >= 0 ? `${consumption.toLocaleString()} units` : 'Invalid Reading'}
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                          consumption < 0 ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          ⚡
                        </div>
                      </div>
                      {consumption < 0 && (
                        <p className="text-xs text-rose-600 font-medium mt-2">
                          Warning: Current reading is less than previous reading!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || (consumption !== null && consumption < 0)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submitting ? 'Recording Reading...' : 'Save Meter Reading'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* History Panel */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Readings History</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedUnit 
                      ? `Readings for ${selectedUnit.propertyId?.name || 'Property'} - Unit ${selectedUnit.unitNumber}`
                      : 'Select a unit to view history'}
                  </p>
                </div>
                {readingsHistory.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {readingsHistory.length} Record{readingsHistory.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {readingsHistory.length === 0 ? (
                <div className="py-16 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-700">No Meter Readings Logged</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Use the form to record the first meter reading for this unit.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 px-2">Month</th>
                        <th className="pb-3 px-2 text-right">Previous</th>
                        <th className="pb-3 px-2 text-right">Current</th>
                        <th className="pb-3 px-2 text-right">Consumption</th>
                        <th className="pb-3 px-2 text-right">Date Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {readingsHistory.map((reading) => {
                        const unitsConsumed = reading.currentReading - reading.previousReading;
                        return (
                          <tr key={reading._id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3.5 px-2 font-bold text-gray-900">
                              {reading.month}
                            </td>
                            <td className="py-3.5 px-2 text-right font-medium text-gray-500">
                              {reading.previousReading.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-2 text-right font-medium text-gray-800">
                              {reading.currentReading.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                {unitsConsumed.toLocaleString()} units
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-right text-xs text-gray-400">
                              {new Date(reading.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
