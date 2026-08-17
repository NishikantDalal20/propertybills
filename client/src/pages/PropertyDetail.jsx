import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_PROPERTIES = 'http://localhost:5000/api/properties';
const API_UNITS = 'http://localhost:5000/api/units';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    unitNumber: '',
    unitType: 'Flat',
    rentAmount: '',
    meterNumber: '',
    status: 'Vacant'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPropertyAndUnits = useCallback(async () => {
    try {
      setLoading(true);
      const propRes = await axios.get(`${API_PROPERTIES}/${propertyId}`, authHeader());
      setProperty(propRes.data);
      
      const unitsRes = await axios.get(`${API_UNITS}/property/${propertyId}`, authHeader());
      setUnits(unitsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch property details or units.');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyAndUnits();
  }, [fetchPropertyAndUnits]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        API_UNITS,
        { ...form, propertyId, rentAmount: Number(form.rentAmount) },
        authHeader()
      );
      setForm({
        unitNumber: '',
        unitType: 'Flat',
        rentAmount: '',
        meterNumber: '',
        status: 'Vacant'
      });
      fetchPropertyAndUnits();
    } catch (err) {
      console.error(err);
      setError('Failed to add unit.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this unit?')) {
      try {
        await axios.delete(`${API_UNITS}/${id}`, authHeader());
        fetchPropertyAndUnits();
      } catch (err) {
        console.error(err);
        setError('Failed to delete unit.');
      }
    }
  };

  const handleToggleStatus = async (unit) => {
    try {
      const newStatus = unit.status === 'Occupied' ? 'Vacant' : 'Occupied';
      await axios.put(`${API_UNITS}/${unit._id}`, { ...unit, status: newStatus }, authHeader());
      fetchPropertyAndUnits();
    } catch (err) {
      console.error(err);
      setError('Failed to update unit status.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-500">Loading details...</span>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <Link to="/properties" className="text-purple-600 hover:underline">← Back to Properties</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto text-left">
      <div className="mb-6">
        <Link to="/properties" className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors font-medium">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Properties
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {property && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                {property.type}
              </span>
              <h1 className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white leading-tight">
                {property.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {property.address}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="border border-gray-100 dark:border-zinc-800 rounded-lg p-3 text-center bg-gray-50/50 dark:bg-zinc-800/20">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{units.length}</div>
                <div>Total Units</div>
              </div>
              <div className="border border-gray-100 dark:border-zinc-800 rounded-lg p-3 text-center bg-gray-50/50 dark:bg-zinc-800/20">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {units.filter(u => u.status === 'Vacant').length}
                </div>
                <div>Vacant</div>
              </div>
              <div className="border border-gray-100 dark:border-zinc-800 rounded-lg p-3 text-center bg-gray-50/50 dark:bg-zinc-800/20">
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {units.filter(u => u.status === 'Occupied').length}
                </div>
                <div>Occupied</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Units list */}
        <div className="lg:col-span-2 text-left">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Rental Units</h2>
          {units.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              No rental units added yet. Use the form to add the first unit.
            </div>
          ) : (
            <div className="space-y-4">
              {units.map((unit) => (
                <div key={unit._id} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-lg">Unit {unit.unitNumber}</span>
                      <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-sans">
                        {unit.unitType}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5 font-sans">
                      <p>Rent: <span className="font-semibold text-gray-800 dark:text-gray-200">₹{unit.rentAmount}</span> / month</p>
                      <p>Meter No: <span className="font-mono">{unit.meterNumber}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(unit)}
                      title="Click to toggle status"
                      className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 font-sans ${
                        unit.status === 'Occupied'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                          : 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-900/50'
                      }`}
                    >
                      {unit.status}
                    </button>
                    <button
                      onClick={() => handleDelete(unit._id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                      title="Delete Unit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Unit Form */}
        <div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Rental Unit</h2>
            <form onSubmit={handleAdd} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Unit Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101, A-1"
                  value={form.unitNumber}
                  required
                  onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-transparent rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Unit Type *
                </label>
                <select
                  value={form.unitType}
                  onChange={(e) => setForm({ ...form, unitType: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-transparent rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-sans"
                >
                  {['House', 'Flat', 'Shop', 'Office', 'Room'].map(t => (
                    <option key={t} value={t} className="bg-white dark:bg-zinc-950 text-gray-900 dark:text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Rent Amount (Monthly) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12000"
                  value={form.rentAmount}
                  required
                  onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-transparent rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Electricity Meter Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ELEC987654"
                  value={form.meterNumber}
                  required
                  onChange={(e) => setForm({ ...form, meterNumber: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-transparent rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-transparent rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-sans"
                >
                  <option value="Vacant" className="bg-white dark:bg-zinc-950 text-gray-900 dark:text-white">Vacant</option>
                  <option value="Occupied" className="bg-white dark:bg-zinc-950 text-gray-900 dark:text-white">Occupied</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 mt-2 shadow-sm cursor-pointer font-sans"
              >
                Add Unit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
