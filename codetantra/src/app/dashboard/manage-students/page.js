'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import { supabase } from '@/app/utils/supabase';

export default function ManageStudentsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', registration_number: '' });
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents();
    }
  }, [selectedClass]);

  const loadUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const userData = await getUserByToken(token);
      if (!userData || (userData.role !== 'admin' && userData.role !== 'teacher')) {
        router.push('/dashboard');
      } else {
        setUser(userData);
        loadClasses(userData);
        loadStudents();
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (userData) => {
    try {
      let query = supabase.from('classes').select('id, name, teacher_id');
      
      // If teacher, only show their classes
      if (userData.role === 'teacher') {
        query = query.eq('teacher_id', userData.id);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      setClasses(data || []);
      
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const loadClassStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          id,
          registration_number,
          student_id,
          created_at,
          users:student_id (name, email)
        `)
        .eq('class_id', selectedClass);

      if (error) throw error;
      setClassStudents(data || []);
    } catch (err) {
      console.error('Failed to load class students:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('class_students')
        .insert([{
          class_id: selectedClass,
          student_id: formData.student_id,
          registration_number: formData.registration_number
        }]);

      if (error) throw error;
      alert('Student added to class successfully!');
      setShowModal(false);
      setFormData({ student_id: '', registration_number: '' });
      loadClassStudents();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Student removed from class successfully!');
      loadClassStudents();
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

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="w-full px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Students</h1>
              <p className="text-gray-600">Add and manage students in classes</p>
            </div>
            {selectedClass && (
              <button
                onClick={() => {
                  setFormData({ student_id: '', registration_number: '' });
                  setShowModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Student to Class
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Students in {selectedClassName}
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Registration Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Added On</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classStudents.map((cs) => (
                  <tr key={cs.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{cs.registration_number}</td>
                    <td className="px-6 py-4 text-gray-900">{cs.users?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{cs.users?.email}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(cs.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(cs.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No students in this class. Click "Add Student to Class" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Add Student to {selectedClassName}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student *
                </label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  placeholder="e.g., RA2111003010001"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ student_id: '', registration_number: '' });
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
