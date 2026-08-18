import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../components/StatusBadge';

const API_PROPERTIES = 'http://localhost:5000/api/properties';
const API_UNITS = 'http://localhost:5000/api/units';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    unitType: 'Flat',
    rentAmount: '',
    meterNumber: '',
    status: 'Vacant'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propRes, unitsRes] = await Promise.all([
        axios.get(`${API_PROPERTIES}/${id}`, authHeader()),
        axios.get(`${API_UNITS}/property/${id}`, authHeader())
      ]);
      setProperty(propRes.data);
      setUnits(unitsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        API_UNITS,
        {
          ...unitForm,
          propertyId: id,
          rentAmount: Number(unitForm.rentAmount)
        },
        authHeader()
      );
      setUnitForm({ unitNumber: '', unitType: 'Flat', rentAmount: '', meterNumber: '', status: 'Vacant' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add unit');
    }
  };

  const handleToggleStatus = async (unit) => {
    const newStatus = unit.status === 'Occupied' ? 'Vacant' : 'Occupied';
    try {
      await axios.put(`${API_UNITS}/${unit._id}`, { status: newStatus }, authHeader());
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    try {
      await axios.delete(`${API_UNITS}/${unitId}`, authHeader());
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete unit');
    }
  };

  if (loading) return <div className="p-8">Loading property details...</div>;
  if (error && !property) return (
    <div className="p-8 text-red-500">
      <p>{error}</p>
      <Link to="/properties" className="text-blue-600 underline mt-4 inline-block">&larr; Back to Properties</Link>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/properties" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Properties</Link>
      
      {property && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
              <p className="text-gray-600 mb-1">{property.address}</p>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded font-medium">
                {property.type}
              </span>
            </div>
            <div className="text-right text-sm text-gray-500">
              Total Units: <span className="font-semibold text-gray-800">{units.length}</span>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-4 text-red-500 bg-red-50 p-3 rounded border border-red-200">{error}</div>}

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4">Add Rental Unit</h2>
        <form onSubmit={handleAddUnit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Unit Number (e.g. 101)"
            value={unitForm.unitNumber}
            required
            onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={unitForm.unitType}
            onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
            className="border p-2 rounded"
          >
            {['House', 'Flat', 'Shop', 'Office', 'Room'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Rent Amount"
            value={unitForm.rentAmount}
            required
            onChange={(e) => setUnitForm({ ...unitForm, rentAmount: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Meter Number"
            value={unitForm.meterNumber}
            required
            onChange={(e) => setUnitForm({ ...unitForm, meterNumber: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={unitForm.status}
            onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="Vacant">Vacant</option>
            <option value="Occupied">Occupied</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
            Add Unit
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4">Rental Units</h2>
        {units.length === 0 ? (
          <p className="text-gray-500">No rental units added yet for this property.</p>
        ) : (
          <div className="divide-y">
            {units.map((unit) => (
              <div key={unit._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">Unit {unit.unitNumber}</span>
                    <StatusBadge status={unit.status} />
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Type: {unit.unitType} | Rent: ₹{unit.rentAmount} | Meter: {unit.meterNumber}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(unit)}
                    className="text-xs bg-gray-100 border hover:bg-gray-200 px-3 py-1.5 rounded transition-colors"
                  >
                    Set as {unit.status === 'Occupied' ? 'Vacant' : 'Occupied'}
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit._id)}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
