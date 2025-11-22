import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, CheckCircle, X, Trash2 } from 'lucide-react';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    loadDeliveries();
    loadWarehouses();
    loadProducts();
  }, []);

  useEffect(() => {
    if (formData.warehouseId) {
      loadLocations(formData.warehouseId);
    }
  }, [formData.warehouseId]);

  const loadDeliveries = async () => {
    try {
      const response = await api.get('/deliveries', { params: { page: 1, limit: 50 } });
      setDeliveries(response.data.data);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products', { params: { page: 1, limit: 100 } });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
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

  const handleNewDelivery = () => {
    setFormData({
      warehouseId: '',
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      notes: '',
      items: []
    });
    setShowModal(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', locationId: '', quantity: 1, unitPrice: 0 }]
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
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      await api.post('/deliveries', formData);
      alert('Delivery created successfully!');
      setShowModal(false);
      loadDeliveries();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create delivery');
    }
  };

  const handleValidate = async (id) => {
    if (!confirm('Are you sure you want to validate this delivery? Stock will be decreased.')) {
      return;
    }
    try {
      await api.post(`/deliveries/${id}/validate`);
      loadDeliveries();
      alert('Delivery validated successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to validate delivery');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Orders</h1>
          <p className="text-gray-600 mt-1">Manage outgoing stock</p>
        </div>
        <button onClick={handleNewDelivery} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Delivery
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Document #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Warehouse</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No deliveries found
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{delivery.documentNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(delivery.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{delivery.warehouse?.code || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{delivery.items?.length || 0} items</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${
                        delivery.status === 'VALIDATED' ? 'text-success' : 'text-warning'
                      }`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {delivery.status === 'PENDING' && (
                        <button
                          onClick={() => handleValidate(delivery.id)}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Validate
                        </button>
                      )}
                      {delivery.status === 'VALIDATED' && (
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
              <h2 className="text-2xl font-semibold">New Delivery</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse *</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select warehouse</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input"
                  placeholder="Customer name (optional)"
                />
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
                        <div className="col-span-4">
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
                          <label className="block text-xs text-gray-600 mb-1">Location</label>
                          <select
                            value={item.locationId}
                            onChange={(e) => updateItem(index, 'locationId', e.target.value)}
                            className="input text-sm"
                            required
                          >
                            <option value="">Select</option>
                            {locations.map((loc) => (
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
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                            className="input text-sm"
                            min="0"
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
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
