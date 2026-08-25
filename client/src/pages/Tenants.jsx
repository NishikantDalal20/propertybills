import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [vacantUnits, setVacantUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'Active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (err) {
      setError('Failed to fetch tenants');
    }
  };

  const fetchVacantUnits = async () => {
    try {
      const res = await api.get('/units/vacant');
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
      await api.post('/tenants', form);
      setForm({ name: '', phone: '', email: '', status: 'Active' });
      toast.success('Tenant added successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add tenant');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tenants/${id}`);
      toast.success('Tenant deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete tenant');
    }
  };

  const handleAssignUnit = async (tenantId) => {
    const unitId = selectedUnits[tenantId];
    if (!unitId) {
      toast.error('Please select a vacant unit');
      return;
    }

    try {
      await api.put(`/tenants/${tenantId}/assign`, { unitId });
      toast.success('Tenant assigned successfully!');
      setSelectedUnits(prev => {
        const copy = { ...prev };
        delete copy[tenantId];
        return copy;
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign unit');
    }
  };

  const handleUnassignUnit = async (tenantId) => {
    try {
      await api.put(`/tenants/${tenantId}/unassign`, {});
      toast.success('Unit unassigned successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign unit');
    }
  };

  const handleToggleStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/tenants/${tenantId}/status`, { status: newStatus });
      toast.success(`Tenant status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tenant status');
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

  const filteredTenants = tenants.filter(t => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = t.name?.toLowerCase().includes(query);
    const unitNumberMatch = t.unitId?.unitNumber?.toLowerCase().includes(query);
    const propertyNameMatch = t.unitId?.propertyId?.name?.toLowerCase().includes(query);

    return nameMatch || unitNumberMatch || propertyNameMatch;
  });

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
              <Link to="/readings" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                Meter Readings
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tenants Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage active rental profiles, status toggle, and property unit assignments.</p>
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

        {/* Search & Filter Bar */}
        <div className="mb-6 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tenants by name or assigned unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tenants List Section */}
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-bold text-gray-600">
              Total Registered Tenants: {tenants.length}
              {searchQuery && ` (Showing ${filteredTenants.length})`}
            </span>
          </div>

          {loading ? (
            <LoadingSpinner center label="Loading tenants data..." />
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="font-medium text-lg">No tenants found</p>
              <p className="text-sm mt-1 text-gray-400">
                {searchQuery ? `No tenants match "${searchQuery}"` : 'Add active lease profiles above to get started.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTenants.map(t => (
                <div key={t._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-gray-50/50 transition-colors">
                  
                  {/* Tenant Identity & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{t.name}</h3>
                      
                      {/* Status Badges */}
                      {t.unitId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Assigned: Unit {t.unitId.unitNumber} ({t.unitId.propertyId?.name || 'Property'})
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleStatus(t._id, t.status)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:opacity-80 active:scale-95 ${
                          t.status === 'Active'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Active' ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                        {t.status}
                      </button>
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
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    
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

                    {/* Unassign Unit Action */}
                    {t.unitId && (
                      <button
                        onClick={() => handleUnassignUnit(t._id)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold py-1.5 px-3.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer text-sm whitespace-nowrap"
                      >
                        Unassign Unit
                      </button>
                    )}

                    {/* Toggle Status Button */}
                    <button
                      onClick={() => handleToggleStatus(t._id, t.status)}
                      className="text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Set {t.status === 'Active' ? 'Inactive' : 'Active'}
                    </button>

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
