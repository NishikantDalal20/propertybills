import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/tenants';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const fetchTenants = async () => {
    const res = await axios.get(API, authHeader());
    setTenants(res.data);
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await axios.post(API, form, authHeader());
    setForm({ name: '', phone: '', email: '' });
    fetchTenants();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`, authHeader());
    fetchTenants();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tenants</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input placeholder="Name" value={form.name} required
          onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Phone" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Email" value={form.email} type="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })} className="border p-2 rounded" />
        <button className="bg-blue-600 text-white px-4 rounded">Add</button>
      </form>
      <ul className="space-y-2">
        {tenants.map(t => (
          <li key={t._id} className="border p-3 rounded flex justify-between items-center hover:bg-gray-50">
            <div className="flex-1 font-medium">
              {t.name} {t.phone && `— ${t.phone}`} {t.email && `(${t.email})`}
            </div>
            <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:text-red-700 ml-4">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
