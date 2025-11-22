import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Package, AlertTriangle, Inbox, Truck, ArrowLeftRight } from 'lucide-react';
import Analytics from '../components/Analytics';

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    totalStock: 0,
    lowStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [kpisRes, recentRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/recent?limit=10'),
      ]);
      setKpis(kpisRes.data.data);
      setRecent(recentRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    { label: 'Total Stock', value: kpis.totalStock, icon: Package, color: 'blue' },
    { label: 'Low Stock Items', value: kpis.lowStockItems, icon: AlertTriangle, color: 'amber' },
    { label: 'Pending Receipts', value: kpis.pendingReceipts, icon: Inbox, color: 'blue' },
    { label: 'Pending Deliveries', value: kpis.pendingDeliveries, icon: Truck, color: 'red' },
    { label: 'Pending Transfers', value: kpis.pendingTransfers, icon: ArrowLeftRight, color: 'purple' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'VALIDATED':
        return 'text-success';
      case 'PENDING':
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time inventory overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${kpi.color}-100`}>
                  <Icon className={`w-6 h-6 text-${kpi.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Document #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No recent transactions
                  </td>
                </tr>
              ) : (
                recent.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{tx.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{tx.documentNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{tx.warehouse}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics & Charts Section */}
      <div className="mt-8">
        <Analytics />
      </div>
    </div>
  );
}

