import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, CheckCircle, X, Trash2 } from 'lucide-react';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });

  useEffect(() => {
    loadTransfers();
    loadWarehouses();
    loadProducts();
  }, []);

  useEffect(() => {
    if (formData.fromWarehouseId) {
      loadLocations(formData.fromWarehouseId, 'from');
    }
  }, [formData.fromWarehouseId]);

  useEffect(() => {
    if (formData.toWarehouseId) {
      loadLocations(formData.toWarehouseId, 'to');
    }
  }, [formData.toWarehouseId]);

  const loadTransfers = async () => {
    try {
      const response = await api.get('/api/transfers', { params: { page: 1, limit: 50 } });
      setTransfers(response.data.data);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products', { params: { page: 1, limit: 100 } });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadLocations = async (warehouseId, type) => {
    try {
      const response = await api.get('/api/locations', { params: { warehouseId } });
      if (type === 'from') {
        setFromLocations(response.data.data);
      } else {
        setToLocations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleNewTransfer = () => {
    setFormData({
      fromWarehouseId: '',
      toWarehouseId: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      items: []
    });
    setShowModal(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', fromLocationId: '', toLocationId: '', quantity: 1 }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.fromWarehouseId === formData.toWarehouseId) {
      alert('Source and destination warehouses must be different');
      return;
    }
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      await api.post('/api/transfers', formData);
      alert('Transfer created successfully!');
      setShowModal(false);
      loadTransfers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create transfer');
    }
  };

  const handleValidate = async (id) => {
    if (!confirm('Are you sure you want to validate this transfer? Stock will be moved between locations.')) {
      return;
    }
    try {
      await api.post(`/api/transfers/${id}/validate`);
      loadTransfers();
      alert('Transfer validated successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to validate transfer');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Internal Transfers</h1>
          <p className="text-gray-600 mt-1">Transfer stock between warehouses</p>
        </div>
        <button onClick={handleNewTransfer} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Transfer
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Document #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">From → To</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{transfer.documentNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(transfer.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {transfer.fromWarehouse?.code} → {transfer.toWarehouse?.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{transfer.items?.length || 0} items</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${
                        transfer.status === 'VALIDATED' ? 'text-success' : 'text-warning'
                      }`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {transfer.status === 'PENDING' && (
                        <button
                          onClick={() => handleValidate(transfer.id)}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Validate
                        </button>
                      )}
                      {transfer.status === 'VALIDATED' && (
                        <span className="text-sm text-gray-400">Validated</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">New Transfer</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Warehouse *</label>
                  <select
                    value={formData.fromWarehouseId}
                    onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Warehouse *</label>
                  <select
                    value={formData.toWarehouseId}
                    onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn btn-secondary text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                {formData.items.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No items added</p>
                ) : (
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border border-gray-200 rounded">
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-600 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="input text-sm"
                            required
                          >
                            <option value="">Select</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.sku} - {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-600 mb-1">From Location</label>
                          <select
                            value={item.fromLocationId}
                            onChange={(e) => updateItem(index, 'fromLocationId', e.target.value)}
                            className="input text-sm"
                            required
                          >
                            <option value="">Select</option>
                            {fromLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-600 mb-1">To Location</label>
                          <select
                            value={item.toLocationId}
                            onChange={(e) => updateItem(index, 'toLocationId', e.target.value)}
                            className="input text-sm"
                            required
                          >
                            <option value="">Select</option>
                            {toLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                            className="input text-sm"
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-error hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
