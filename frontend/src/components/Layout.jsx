import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { 
  LayoutDashboard, Package, Inbox, Truck, ArrowLeftRight, 
  Calculator, BookOpen, Settings, User, LogOut 
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/receipts', icon: Inbox, label: 'Receipts' },
  { path: '/deliveries', icon: Truck, label: 'Deliveries' },
  { path: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  { path: '/adjustments', icon: Calculator, label: 'Adjustments' },
  { path: '/ledger', icon: BookOpen, label: 'Ledger' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">StockMaster</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name || user?.phone}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

