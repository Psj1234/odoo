import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import api from '../lib/api';

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#6366F1',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
  lightBlue: '#60A5FA',
  lightGreen: '#34D399'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.amber,
  COLORS.purple,
  COLORS.gray
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/api/dashboard/analytics');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Charts</h2>
        <p className="text-gray-600 mt-1">Comprehensive inventory insights and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Stock Level Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Level Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.stockLevelOverview || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Low Stock Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.lowStockTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke={COLORS.red} 
                strokeWidth={2}
                dot={{ fill: COLORS.red, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Incoming vs Outgoing Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incoming vs Outgoing Stock</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.incomingOutgoing || []}>
              <defs>
                <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.lightBlue} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.lightBlue} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.lightGreen} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.lightGreen} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="receipts" 
                stroke={COLORS.primary} 
                fill="url(#colorReceipts)" 
                name="Receipts"
              />
              <Area 
                type="monotone" 
                dataKey="deliveries" 
                stroke={COLORS.secondary} 
                fill="url(#colorDeliveries)" 
                name="Deliveries"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Stock Distribution by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.categoryDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data.categoryDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Warehouse Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={data.warehouseUtilization || []}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar 
                dataKey="utilization" 
                fill={COLORS.accent}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6. Top Moving Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Moving Products</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.topMoving || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 7. Monthly Stock Movements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Stock Movements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.monthlyMovements || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="receipts" stackId="a" fill={COLORS.primary} name="Receipts" />
              <Bar dataKey="deliveries" stackId="a" fill={COLORS.secondary} name="Deliveries" />
              <Bar dataKey="adjustments" stackId="a" fill={COLORS.amber} name="Adjustments" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 8. Adjustment Reasons Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjustment Reasons</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.adjustmentReasons || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data.adjustmentReasons || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#374151', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 9. Internal Transfer Flow Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal Transfer Flow Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.transferFlowSummary || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill={COLORS.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}



