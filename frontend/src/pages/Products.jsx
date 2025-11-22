import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Search, X } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    unit: 'pcs',
    reorderPoint: 10
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [search]);

  const loadProducts = async () => {
    try {
      const params = { page: 1, limit: 50 };
      if (search) params.search = search;
      const response = await api.get('/products', { params });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: '',
      unit: 'pcs',
      reorderPoint: 10
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      unit: product.unit,
      reorderPoint: product.reorderPoint || 10
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', formData);
        alert('Product created successfully!');
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save product');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={handleNewProduct} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU or name..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{product.sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{product.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{product.category?.name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${
                        product.stock.total < 10 ? 'text-warning' : 'text-gray-900'
                      }`}>
                        {product.stock.total}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input"
                  required
                  disabled={!!editingProduct}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="input"
                  placeholder="pcs, kg, etc."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Point</label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) })}
                  className="input"
                  min="0"
                />
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
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

