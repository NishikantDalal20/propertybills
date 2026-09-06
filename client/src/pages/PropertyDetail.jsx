import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PropertyDetail() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    unitType: 'Flat',
    rentAmount: '',
    meterNumber: '',
    status: 'Vacant'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [propRes, unitsRes] = await Promise.all([
        api.get(`/properties/${id}`),
        api.get(`/units/property/${id}`)
      ]);
      setProperty(propRes.data);
      setUnits(unitsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/units', {
        ...unitForm,
        propertyId: id,
        rentAmount: Number(unitForm.rentAmount)
      });
      setUnitForm({ unitNumber: '', unitType: 'Flat', rentAmount: '', meterNumber: '', status: 'Vacant' });
      toast.success('Rental unit added successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add unit');
    }
  };

  const handleToggleStatus = async (unit) => {
    const newStatus = unit.status === 'Occupied' ? 'Vacant' : 'Occupied';
    try {
      await api.put(`/units/${unit._id}`, { status: newStatus });
      toast.success(`Unit status set to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    try {
      await api.delete(`/units/${unitId}`);
      toast.success('Unit deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete unit');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Link to="/properties" className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 inline-flex items-center gap-1.5 transition-colors">
          &larr; Back to Properties
        </Link>
        
        {property && (
          <Card className="p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                  <Badge variant="default">
                    {property.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{property.address}</p>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200/60">
                Total Units: <span className="font-bold text-gray-900">{units.length}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Add Unit Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Rental Unit
          </h2>
          <form onSubmit={handleAddUnit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Unit Number"
              value={unitForm.unitNumber}
              required
              onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
            />
            <Select
              value={unitForm.unitType}
              onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
            >
              {['House', 'Flat', 'Shop', 'Office', 'Room'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Rent Amount"
              value={unitForm.rentAmount}
              required
              onChange={(e) => setUnitForm({ ...unitForm, rentAmount: e.target.value })}
            />
            <Input
              placeholder="Meter Number"
              value={unitForm.meterNumber}
              required
              onChange={(e) => setUnitForm({ ...unitForm, meterNumber: e.target.value })}
            />
            <Select
              value={unitForm.status}
              onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
            >
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
            </Select>
            <Button type="submit">
              Add Unit
            </Button>
          </form>
        </Card>

        {/* Units List */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-bold text-gray-600">Rental Units ({units.length})</span>
          </div>

          {loading ? (
            <LoadingSpinner center label="Loading unit configurations..." />
          ) : units.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="font-medium text-lg">No units added yet</p>
              <p className="text-sm mt-1 text-gray-400">Add rental units above for this property.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {units.map((unit) => (
                <div key={unit._id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 text-lg">Unit {unit.unitNumber}</span>
                      <StatusBadge status={unit.status} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
                      <span>Type: {unit.unitType}</span>
                      <span>Rent: ₹{unit.rentAmount}</span>
                      <span>Meter: {unit.meterNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(unit)}
                    >
                      Set as {unit.status === 'Occupied' ? 'Vacant' : 'Occupied'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUnit(unit._id)}
                      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
