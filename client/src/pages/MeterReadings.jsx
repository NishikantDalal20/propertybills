import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import GenerateBillButton from '../components/GenerateBillButton';
import LoadingSpinner from '../components/LoadingSpinner';

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
  
  // Dynamic Utility Charge Inputs
  const [electricityRate, setElectricityRate] = useState(10);
  const [waterCharges, setWaterCharges] = useState(300);
  const [maintenanceFee, setMaintenanceFee] = useState(500);

  const [loadingUnits, setLoadingUnits] = useState(true);
  const [fetchingPrevious, setFetchingPrevious] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoadingUnits(true);
        const res = await api.get('/units');
        setUnits(res.data);
        if (res.data.length > 0) {
          setSelectedUnitId(res.data[0]._id);
        }
      } catch {
        setError('Failed to fetch units list');
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  useEffect(() => {
    if (!selectedUnitId) return;

    const fetchHistoryAndPrevious = async () => {
      try {
        setFetchingPrevious(true);
        const res = await api.get(`/readings/unit/${selectedUnitId}`);
        const history = res.data;
        setReadingsHistory(history);

        if (history.length > 0) {
          const sorted = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPreviousReading(sorted[0].currentReading);
        } else {
          setPreviousReading(0);
        }
      } catch {
        console.error('Failed to fetch reading history');
        setPreviousReading(0);
        setReadingsHistory([]);
      } finally {
        setFetchingPrevious(false);
      }
    };

    fetchHistoryAndPrevious();
  }, [selectedUnitId]);

  const curr = Number(currentReading) || 0;
  const prev = Number(previousReading) || 0;
  const calculatedConsumption = curr >= prev ? curr - prev : 0;
  const isValidConsumption = curr >= prev && currentReading !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnitId) return toast.error('Please select a unit');
    if (!isValidConsumption) return toast.error('Current reading must be greater than or equal to previous reading');

    try {
      setSubmitting(true);
      await api.post('/readings', {
        unitId: selectedUnitId,
        month,
        previousReading: prev,
        currentReading: curr,
        unitsConsumed: calculatedConsumption
      });

      toast.success('Meter reading saved successfully!');
      setCurrentReading('');

      const res = await api.get(`/readings/unit/${selectedUnitId}`);
      setReadingsHistory(res.data);
      if (res.data.length > 0) {
        const sorted = [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPreviousReading(sorted[0].currentReading);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meter reading');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUnit = units.find(u => u._id === selectedUnitId);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Navbar />

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
          </div>
        )}

        {loadingUnits ? (
          <LoadingSpinner center label="Loading rental units..." />
        ) : units.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200/80 shadow-sm text-center text-gray-500">
            <p className="font-medium text-lg">No rental units found</p>
            <p className="text-sm mt-1 text-gray-400">Please add properties and rental units first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                New Entry & Utility Calculation
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Unit & Month Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Select Rental Unit
                    </label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      {units.map((unit) => (
                        <option key={unit._id} value={unit._id}>
                          {unit.propertyId?.name ? `${unit.propertyId.name} - Unit ${unit.unitNumber}` : `Unit ${unit.unitNumber}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Billing Month
                    </label>
                    <input
                      type="month"
                      value={month}
                      required
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Readings Entry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Previous Reading
                      </label>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {fetchingPrevious ? <LoadingSpinner size="sm" label="Fetching..." /> : 'Auto-Fetched'}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={previousReading}
                      readOnly
                      className="w-full px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Current Reading <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Enter current meter reading"
                      value={currentReading}
                      required
                      min={prev}
                      onChange={(e) => setCurrentReading(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Calculated Consumption Box */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 block">Calculated Consumption</span>
                    <span className="text-2xl font-extrabold text-blue-950 mt-0.5 block">
                      {calculatedConsumption} <span className="text-sm font-semibold text-blue-800">kWh Units</span>
                    </span>
                  </div>

                  {isValidConsumption && (
                    <div className="text-right">
                      <span className="text-[11px] text-blue-600 font-medium block">Est. Electricity Cost</span>
                      <span className="text-base font-bold text-blue-900">
                        ₹{(calculatedConsumption * (Number(electricityRate) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Utility Fees Breakdown Section */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Rate & Fee Setup for Bill</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Electricity Rate (₹/Unit)</label>
                      <input
                        type="number"
                        value={electricityRate}
                        onChange={(e) => setElectricityRate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Water Utility (₹)</label>
                      <input
                        type="number"
                        value={waterCharges}
                        onChange={(e) => setWaterCharges(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Maintenance Fee (₹)</label>
                      <input
                        type="number"
                        value={maintenanceFee}
                        onChange={(e) => setMaintenanceFee(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !isValidConsumption}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {submitting ? <LoadingSpinner size="sm" color="white" label="Recording Reading..." /> : 'Save Meter Reading'}
                  </button>

                  <GenerateBillButton
                    readingId={readingsHistory[0]?._id}
                    unitId={selectedUnitId}
                    unitRent={selectedUnit?.rentAmount || 0}
                    month={month}
                    consumption={calculatedConsumption}
                    electricityRate={electricityRate}
                    water={waterCharges}
                    maintenance={maintenanceFee}
                    disabled={!isValidConsumption}
                    variant="primary"
                  />
                </div>
              </form>
            </div>

            {/* History Table Section */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Reading History</span>
                {readingsHistory.length > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                    {readingsHistory.length} Record{readingsHistory.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>

              {readingsHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-xs font-medium">No previous reading history for this unit.</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full text-xs text-gray-700 text-left">
                    <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200/80">
                      <tr>
                        <th className="py-3 px-3">Month</th>
                        <th className="py-3 px-3 text-right">Readings</th>
                        <th className="py-3 px-3 text-right">Consumed</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {readingsHistory.map((reading) => {
                        return (
                          <tr key={reading._id} className="hover:bg-gray-50/60 transition-all">
                            <td className="py-3 px-3 font-semibold text-gray-800">
                              {reading.month}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-gray-600">
                              {reading.previousReading} &rarr; {reading.currentReading}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-blue-600">
                              {reading.unitsConsumed} Units
                            </td>
                            <td className="py-3 px-3 text-right">
                              <GenerateBillButton
                                readingId={reading._id}
                                unitId={selectedUnitId}
                                unitRent={selectedUnit?.rentAmount || 0}
                                month={reading.month}
                                consumption={reading.unitsConsumed}
                                electricityRate={electricityRate}
                                water={waterCharges}
                                maintenance={maintenanceFee}
                                variant="table"
                              />
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
        )}
      </main>
    </div>
  );
}
