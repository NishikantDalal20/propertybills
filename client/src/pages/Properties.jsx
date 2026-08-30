import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', type: 'House' });
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/properties', form);
      setForm({ name: '', address: '', type: 'House' });
      toast.success('Property added successfully!');
      fetchProperties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add property');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch {
      toast.error('Failed to delete property');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Properties Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage rental properties and view unit configurations.</p>
        </div>

        {/* Add Property Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Add New Property
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              placeholder="Property Name"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              placeholder="Address"
              value={form.address}
              required
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {['House', 'Flat', 'Shop', 'Office', 'Room'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer">
              Create Property
            </button>
          </form>
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-bold text-gray-600">Total Registered Properties: {properties.length}</span>
          </div>

          {loading ? (
            <LoadingSpinner center label="Loading properties data..." />
          ) : properties.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="font-medium text-lg">No properties found</p>
              <p className="text-sm mt-1 text-gray-400">Add property locations above to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {properties.map(p => (
                <div key={p._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link to={`/properties/${p._id}`} className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors truncate">
                        {p.name}
                      </Link>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {p.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link to={`/properties/${p._id}`}>
                      <button className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all cursor-pointer">
                        View Units &rarr;
                      </button>
                    </Link>
                    <button onClick={() => handleDelete(p._id)} className="px-3.5 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all cursor-pointer">
                      Delete
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