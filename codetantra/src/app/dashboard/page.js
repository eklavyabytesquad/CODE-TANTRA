'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const userData = await getUserByToken(token);
        if (!userData) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          router.push('/login');
        } else {
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-blue-600 text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Dashboard Navbar */}
      <DashboardNavbar user={user} onLogout={handleLogout} />

      {/* Dashboard Content - Full Width */}
      <div className="w-full px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Logged in as <span className="font-semibold capitalize">{user.role}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">18</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">85%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 mb-1">Email Address</p>
              <p className="text-lg font-semibold text-gray-900">{user.email}</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 mb-1">User Role</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{user.role}</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 mb-1">User ID</p>
              <p className="text-sm font-mono text-gray-900">{user.id}</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions based on role */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {user.role === 'admin' && (
              <>
                <Link href="/dashboard/create-test" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border-2 border-blue-200 transition-all">
                  <div className="text-blue-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Create Test</h3>
                  <p className="text-sm text-gray-600">Add new test</p>
                </Link>
                <Link href="/dashboard/manage-tests" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border-2 border-green-200 transition-all">
                  <div className="text-green-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Manage Tests</h3>
                  <p className="text-sm text-gray-600">Edit tests</p>
                </Link>
                <Link href="/dashboard/manage-users" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border-2 border-purple-200 transition-all">
                  <div className="text-purple-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Manage Users</h3>
                  <p className="text-sm text-gray-600">User management</p>
                </Link>
                <Link href="/dashboard/analytics" className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg border-2 border-orange-200 transition-all">
                  <div className="text-orange-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-600">View reports</p>
                </Link>
              </>
            )}
            {user.role === 'teacher' && (
              <>
                <Link href="/dashboard/create-test" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border-2 border-blue-200 transition-all">
                  <div className="text-blue-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Create Test</h3>
                  <p className="text-sm text-gray-600">Add new test</p>
                </Link>
                <Link href="/dashboard/manage-tests" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border-2 border-green-200 transition-all">
                  <div className="text-green-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Manage Tests</h3>
                  <p className="text-sm text-gray-600">Edit your tests</p>
                </Link>
                <Link href="/dashboard/grade-tests" className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg border-2 border-yellow-200 transition-all">
                  <div className="text-yellow-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Grade Tests</h3>
                  <p className="text-sm text-gray-600">Review submissions</p>
                </Link>
                <Link href="/dashboard/students" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border-2 border-purple-200 transition-all">
                  <div className="text-purple-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Students</h3>
                  <p className="text-sm text-gray-600">View students</p>
                </Link>
              </>
            )}
            {user.role === 'student' && (
              <>
                <Link href="/dashboard/attend-test" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border-2 border-blue-200 transition-all">
                  <div className="text-blue-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Attend Test</h3>
                  <p className="text-sm text-gray-600">Take a test</p>
                </Link>
                <Link href="/dashboard/my-tests" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border-2 border-green-200 transition-all">
                  <div className="text-green-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">My Tests</h3>
                  <p className="text-sm text-gray-600">View all tests</p>
                </Link>
                <Link href="/dashboard/results" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border-2 border-purple-200 transition-all">
                  <div className="text-purple-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Results</h3>
                  <p className="text-sm text-gray-600">Check scores</p>
                </Link>
                <Link href="/dashboard/elab" className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg border-2 border-orange-200 transition-all">
                  <div className="text-orange-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">E-Lab</h3>
                  <p className="text-sm text-gray-600">Virtual labs</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
