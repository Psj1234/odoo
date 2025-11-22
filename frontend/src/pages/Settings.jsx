import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, X } from 'lucide-react';

export default function Settings() {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: ''
  });
  const [locationForm, setLocationForm] = useState({
    name: '',
    code: '',
    type: 'STORAGE'
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      loadLocations(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data);
      if (response.data.data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async (warehouseId) => {
    try {
      const response = await api.get('/locations', { params: { warehouseId } });
      setLocations(response.data.data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleNewWarehouse = () => {
    setEditingWarehouse(null);
    setWarehouseForm({ name: '', code: '', address: '', phone: '' });
    setShowWarehouseModal(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      phone: warehouse.phone || ''
    });
    setShowWarehouseModal(true);
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await api.put(`/warehouses/${editingWarehouse.id}`, warehouseForm);
        alert('Warehouse updated successfully!');
      } else {
        await api.post('/warehouses', warehouseForm);
        alert('Warehouse created successfully!');
      }
      setShowWarehouseModal(false);
      loadWarehouses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save warehouse');
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!confirm('Are you sure you want to delete this warehouse? This will also delete all locations and related data.')) {
      return;
    }
    try {
      await api.delete(`/warehouses/${id}`);
      alert('Warehouse deleted successfully!');
      loadWarehouses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete warehouse');
    }
  };

  const handleNewLocation = () => {
    if (!selectedWarehouse) {
      alert('Please select a warehouse first');
      return;
    }
    setEditingLocation(null);
    setLocationForm({ name: '', code: '', type: 'STORAGE' });
    setShowLocationModal(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      code: location.code,
      type: location.type
    });
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, locationForm);
        alert('Location updated successfully!');
      } else {
        await api.post('/locations', {
          ...locationForm,
          warehouseId: selectedWarehouse
        });
        alert('Location created successfully!');
      }
      setShowLocationModal(false);
      loadLocations(selectedWarehouse);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save location');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!confirm('Are you sure you want to delete this location? This will also delete all stock data for this location.')) {
      return;
    }
    try {
      await api.delete(`/locations/${id}`);
      alert('Location deleted successfully!');
      loadLocations(selectedWarehouse);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete location');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage warehouses and locations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Warehouses</h2>
            <button onClick={handleNewWarehouse} className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedWarehouse === warehouse.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedWarehouse(warehouse.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{warehouse.name}</p>
                    <p className="text-sm text-gray-600">{warehouse.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWarehouse(warehouse);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWarehouse(warehouse.id);
                      }}
                      className="text-sm text-error hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Locations
              {selectedWarehouse && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({warehouses.find(w => w.id === selectedWarehouse)?.name})
                </span>
              )}
            </h2>
            <button 
              onClick={handleNewLocation} 
              className="btn btn-primary flex items-center gap-2 text-sm"
              disabled={!selectedWarehouse}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {locations.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No locations found</p>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-gray-600">{location.code} • {location.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditLocation(location)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteLocation(location.id)}
                        className="text-sm text-error hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
              </h2>
              <button onClick={() => setShowWarehouseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveWarehouse}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                <input
                  type="text"
                  value={warehouseForm.code}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  className="input"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={warehouseForm.phone}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingWarehouse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {editingLocation ? 'Edit Location' : 'New Location'}
              </h2>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLocation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                <input
                  type="text"
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={locationForm.type}
                  onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="STORAGE">Storage</option>
                  <option value="PICKING">Picking</option>
                  <option value="RECEIVING">Receiving</option>
                  <option value="SHIPPING">Shipping</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
