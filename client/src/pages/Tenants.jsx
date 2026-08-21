import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_TENANTS = 'http://localhost:5000/api/tenants';
const API_VACANT_UNITS = 'http://localhost:5000/api/units/vacant';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [vacantUnits, setVacantUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'Active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchTenants = async () => {
    try {
      const res = await axios.get(API_TENANTS, authHeader());
      setTenants(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tenants');
    }
  };

  const fetchVacantUnits = async () => {
    try {
      const res = await axios.get(API_VACANT_UNITS, authHeader());
      setVacantUnits(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchTenants(), fetchVacantUnits()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_TENANTS, form, authHeader());
      setForm({ name: '', phone: '', email: '', status: 'Active' });
      triggerToast('Tenant added successfully!', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to add tenant', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_TENANTS}/${id}`, authHeader());
      triggerToast('Tenant deleted successfully', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete tenant', 'error');
    }
  };

  const handleAssignUnit = async (tenantId) => {
    const unitId = selectedUnits[tenantId];
    if (!unitId) {
      triggerToast('Please select a vacant unit', 'error');
      return;
    }

    try {
      await axios.put(`${API_TENANTS}/${tenantId}/assign`, { unitId }, authHeader());
      triggerToast('Tenant assigned successfully!', 'success');
      setSelectedUnits(prev => {
        const copy = { ...prev };
        delete copy[tenantId];
        return copy;
      });
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to assign unit', 'error');
    }
  };

  const handleSelectUnit = (tenantId, unitId) => {
    setSelectedUnits(prev => ({ ...prev, [tenantId]: unitId }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      {/* Top Header / Navigation */}
      <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-md bg-white/95">
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
              <Link to="/tenants" className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-600 transition-all">
                Tenants
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50/95 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tenants Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage active rental profiles, status, and property unit assignments.</p>
        </div>

        {/* Add Tenant Section */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New Tenant
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              placeholder="Name"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm transition-all"
            />
            <input
              placeholder="Phone (Optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm transition-all"
            />
            <input
              placeholder="Email (Optional)"
              value={form.email}
              type="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm transition-all"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm bg-white font-medium text-gray-700 transition-all cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer text-sm"
            >
              Create Tenant
            </button>
          </form>
        </div>

        {/* Tenants List Section */}
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-bold text-gray-600">Total Registered Tenants: {tenants.length}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading tenants data...
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="font-medium text-lg">No tenants found</p>
              <p className="text-sm mt-1 text-gray-400">Add active lease profiles above to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tenants.map(t => (
                <div key={t._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-gray-50/50 transition-colors">
                  
                  {/* Tenant Identity & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{t.name}</h3>
                      
                      {/* Status Badges */}
                      {t.unitId ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Assigned: {t.unitId.unitNumber} ({t.unitId.propertyId?.name || 'Property'})
                        </span>
                      ) : t.status === 'Active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                      {t.phone && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {t.phone}
                        </span>
                      )}
                      {t.email && (
                        <span className="flex items-center gap-1.5 truncate">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {t.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    
                    {/* Inline Assignment Form */}
                    {!t.unitId && t.status === 'Active' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={selectedUnits[t._id] || ''}
                          onChange={(e) => handleSelectUnit(t._id, e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm bg-white font-medium text-gray-700 w-full sm:w-64 cursor-pointer"
                        >
                          <option value="">Select Vacant Unit...</option>
                          {vacantUnits.map(unit => (
                            <option key={unit._id} value={unit._id}>
                              Unit {unit.unitNumber} - {unit.propertyId?.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignUnit(t._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer text-sm whitespace-nowrap"
                        >
                          Assign
                        </button>
                      </div>
                    )}

                    {/* Delete Action */}
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ml-auto"
                    >
                      Delete Profile
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
