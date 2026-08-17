import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/properties';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', type: 'House' });

  const fetchProperties = async () => {
    const res = await axios.get(API, authHeader());
    setProperties(res.data);
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await axios.post(API, form, authHeader());
    setForm({ name: '', address: '', type: 'House' });
    fetchProperties();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`, authHeader());
    fetchProperties();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Properties</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input placeholder="Name" value={form.name} required
          onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Address" value={form.address} required
          onChange={(e) => setForm({ ...form, address: e.target.value })} className="border p-2 rounded" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border p-2 rounded">
          {['House', 'Flat', 'Shop', 'Office', 'Room'].map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="bg-blue-600 text-white px-4 rounded">Add</button>
      </form>
      <ul className="space-y-2">
        {properties.map(p => (
          <li key={p._id} className="border p-3 rounded flex justify-between">
            <span>{p.name} — {p.address} ({p.type})</span>
            <button onClick={() => handleDelete(p._id)} className="text-red-500">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}