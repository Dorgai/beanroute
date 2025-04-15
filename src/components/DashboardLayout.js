import { ShoppingCartIcon } from '@heroicons/react/24/outline';

// Add retail order management menu items
const menuItems = [
  // ... existing menu items ...
  {
    title: 'Retail Order Management',
    icon: <ShoppingCartIcon />,
    href: '/retail-inventory',
    roles: ['ADMIN', 'OWNER', 'RETAILER', 'BARISTA']
  },
  // ... existing menu items ...
];

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {menuItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 