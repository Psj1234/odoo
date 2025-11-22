import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    try {
      const response = await api.get('/ledger', { params: { page: 1, limit: 100 } });
      setEntries(response.data.data);
    } catch (error) {
      console.error('Failed to load ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'RECEIPT':
        return 'text-success';
      case 'DELIVERY':
        return 'text-error';
      case 'TRANSFER_IN':
        return 'text-blue-600';
      case 'TRANSFER_OUT':
        return 'text-purple-600';
      case 'ADJUSTMENT':
        return 'text-warning';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Move History (Ledger)</h1>
        <p className="text-gray-600 mt-1">Complete audit trail of all stock movements</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Qty</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No ledger entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm font-medium">{entry.productSku}</span>
                        <br />
                        <span className="text-xs text-gray-500">{entry.product}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getTypeColor(entry.type)}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${
                        entry.quantity > 0 ? 'text-success' : 'text-error'
                      }`}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{entry.location}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{entry.user}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

