'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import { supabase } from '@/app/utils/supabase';

export default function ManageClassesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', teacher_id: '' });
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const userData = await getUserByToken(token);
      if (!userData || userData.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(userData);
        loadClasses();
        loadTeachers();
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          teacher_id,
          users:teacher_id (name, email)
        `)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'teacher')
        .order('name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update({ name: formData.name, teacher_id: formData.teacher_id || null })
          .eq('id', editingClass.id);

        if (error) throw error;
        alert('Class updated successfully!');
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([{ name: formData.name, teacher_id: formData.teacher_id || null }]);

        if (error) throw error;
        alert('Class created successfully!');
      }

      setShowModal(false);
      setFormData({ name: '', teacher_id: '' });
      setEditingClass(null);
      loadClasses();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      teacher_id: classItem.teacher_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Class deleted successfully!');
      loadClasses();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="w-full px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Classes</h1>
              <p className="text-gray-600">Create and manage all classes</p>
            </div>
            <button
              onClick={() => {
                setEditingClass(null);
                setFormData({ name: '', teacher_id: '' });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Class
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Class Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Assigned Teacher</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Teacher Email</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classes.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{classItem.name}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {classItem.users?.name || 'Not Assigned'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {classItem.users?.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(classItem)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(classItem.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No classes found. Click "Add New Class" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  placeholder="e.g., Computer Science A"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Teacher (Optional)
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingClass ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClass(null);
                    setFormData({ name: '', teacher_id: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
