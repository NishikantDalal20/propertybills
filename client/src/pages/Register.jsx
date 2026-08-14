import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'owner' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input placeholder="Name" required className="w-full border p-2 rounded mb-4"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="email" placeholder="Email" required className="w-full border p-2 rounded mb-4"
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" required className="w-full border p-2 rounded mb-4"
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Register</button>
        <p className="mt-4 text-sm">Have an account? <Link to="/" className="text-blue-600">Login</Link></p>
      </form>
    </div>
  );
}