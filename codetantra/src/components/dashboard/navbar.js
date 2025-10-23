'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardNavbar({ user, onLogout }) {
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      { label: 'Dashboard', href: '/dashboard', roles: ['admin', 'teacher', 'student'] }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { label: 'Manage Classes', href: '/dashboard/manage-classes', roles: ['admin'] },
        { label: 'Manage Students', href: '/dashboard/manage-students', roles: ['admin'] },
        { label: 'Manage Questions', href: '/dashboard/manage-questions', roles: ['admin'] },
        { label: 'Create Test', href: '/dashboard/create-test', roles: ['admin'] },
        { label: 'Manage Tests', href: '/dashboard/manage-tests', roles: ['admin'] },
        { label: 'Manage Users', href: '/dashboard/manage-users', roles: ['admin'] },
        { label: 'Analytics', href: '/dashboard/analytics', roles: ['admin'] }
      ];
    } else if (user?.role === 'teacher') {
      return [
        ...baseItems,
        { label: 'My Classes', href: '/dashboard/manage-classes', roles: ['teacher'] },
        { label: 'Manage Students', href: '/dashboard/manage-students', roles: ['teacher'] },
        { label: 'Manage Questions', href: '/dashboard/manage-questions', roles: ['teacher'] },
        { label: 'Create Test', href: '/dashboard/create-test', roles: ['teacher'] },
        { label: 'Manage Tests', href: '/dashboard/manage-tests', roles: ['teacher'] },
        { label: 'Grade Tests', href: '/dashboard/grade-tests', roles: ['teacher'] }
      ];
    } else {
      return [
        ...baseItems,
        { label: 'Attend Test', href: '/dashboard/attend-test', roles: ['student'] },
        { label: 'My Tests', href: '/dashboard/my-tests', roles: ['student'] },
        { label: 'Results', href: '/dashboard/results', roles: ['student'] },
        { label: 'E-Lab', href: '/dashboard/elab', roles: ['student'] }
      ];
    }
  };

  const navItems = getNavItems();

  // Role badge color
  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-red-500';
      case 'teacher':
        return 'bg-green-500';
      case 'student':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="w-full px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-bold text-xl">
                CT
              </div>
              <span className="text-xl font-bold text-gray-800">CodeTantra SRM</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className={`${getRoleBadgeColor()} text-white px-3 py-1 rounded-full text-sm font-semibold uppercase`}>
              {user?.role}
            </div>

            {/* User Details */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>

            {/* User Avatar */}
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
