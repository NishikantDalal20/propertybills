import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [vacantUnits, setVacantUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'Active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch {
      setError('Failed to fetch tenants');
    }
  };

  const fetchVacantUnits = async () => {
    try {
      const res = await api.get('/units');
      const vacant = res.data.filter(u => u.status === 'Vacant');
      setVacantUnits(vacant);
    } catch {
      console.error('Failed to fetch vacant units');
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

  const handleAddTenant = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tenants', form);
      setForm({ name: '', phone: '', email: '', status: 'Active' });
      toast.success('Tenant registered successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add tenant');
    }
  };

  const handleDeleteTenant = async (id) => {
    try {
      await api.delete(`/tenants/${id}`);
      toast.success('Tenant deleted successfully');
      loadData();
    } catch {
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
      toast.success('Tenant assigned to unit');
      setSelectedUnits(prev => ({ ...prev, [tenantId]: '' }));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign unit');
    }
  };

  const handleUnassignUnit = async (tenantId) => {
    try {
      await api.put(`/tenants/${tenantId}/unassign`);
      toast.success('Tenant unassigned successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign tenant');
    }
  };

  const handleSelectUnit = (tenantId, unitId) => {
    setSelectedUnits(prev => ({ ...prev, [tenantId]: unitId }));
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
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tenants Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage active tenant profiles and assign them to rental units.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Add Tenant Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register New Tenant
          </h2>
          <form onSubmit={handleAddTenant} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              placeholder="Full Name"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer">
              Add Tenant
            </button>
          </form>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search by tenant name, unit, property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tenants Directory List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-bold text-gray-600">Registered Tenants ({filteredTenants.length})</span>
          </div>

          {loading ? (
            <LoadingSpinner center label="Loading tenants data..." />
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="font-medium text-lg">No tenants found</p>
              <p className="text-sm mt-1 text-gray-400">Register new tenants using the form above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTenants.map((t) => {
                const isAssigned = !!t.unitId;
                const unitInfo = t.unitId;

                return (
                  <div key={t._id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">{t.name}</h3>
                        <StatusBadge status={isAssigned ? 'Occupied' : 'Vacant'} />
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-4 mt-1">
                        {t.phone && <span>📞 {t.phone}</span>}
                        {t.email && <span>✉️ {t.email}</span>}
                      </div>

                      {/* Assigned Unit Meta */}
                      {isAssigned ? (
                        <div className="mt-3 inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-800">
                          <span>🏠 Property: {unitInfo?.propertyId?.name || 'Property'}</span>
                          <span>&bull;</span>
                          <span>Unit {unitInfo?.unitNumber || 'Unit'}</span>
                          <span>&bull;</span>
                          <span>Rent: ₹{unitInfo?.rentAmount || 0}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ No unit assigned currently</p>
                      )}
                    </div>

                    {/* Unit Assignment Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      {isAssigned ? (
                        <button
                          onClick={() => handleUnassignUnit(t._id)}
                          className="px-3.5 py-1.5 border border-gray-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          Unassign Unit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select
                            value={selectedUnits[t._id] || ''}
                            onChange={(e) => handleSelectUnit(t._id, e.target.value)}
                            className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">Select Vacant Unit...</option>
                            {vacantUnits.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.propertyId?.name ? `${u.propertyId.name} - Unit ${u.unitNumber}` : `Unit ${u.unitNumber}`} (₹{u.rentAmount})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignUnit(t._id)}
                            disabled={!selectedUnits[t._id]}
                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          >
                            Assign
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteTenant(t._id)}
                        className="px-3.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
