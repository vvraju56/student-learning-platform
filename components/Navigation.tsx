'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationProps {
  user: { username: string; mobileNumber: string };
  onLogout: () => void;
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/detection', label: 'Live Detection' },
    { href: '/search', label: 'Search Content' },
    { href: '/alerts', label: 'Alerts' },
    { href: '/reports', label: 'Reports' },
  ];

  const handleLogout = () => {
    onLogout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            EduMonitor
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition ${
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.displayName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
