'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import { supabase } from '@/app/utils/supabase';

export default function ManageTestsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    test_type: 'mcq',
    class_id: '',
    scheduled_at: '',
    duration: 30
  });
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
      if (!userData || (userData.role !== 'admin' && userData.role !== 'teacher')) {
        router.push('/dashboard');
      } else {
        setUser(userData);
        loadTests(userData);
        loadClasses(userData);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async (userData) => {
    try {
      let query = supabase
        .from('tests')
        .select(`
          id,
          title,
          test_type,
          scheduled_at,
          duration,
          created_at,
          classes:class_id (name),
          users:created_by (name)
        `)
        .order('created_at', { ascending: false });

      if (userData.role === 'teacher') {
        query = query.eq('created_by', userData.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  };

  const loadClasses = async (userData) => {
    try {
      let query = supabase.from('classes').select('id, name');
      if (userData.role === 'teacher') {
        query = query.eq('teacher_id', userData.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadTestDetails = async (testId) => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select(`
          question_order,
          questions (
            id,
            title,
            description,
            question_type,
            marks,
            options,
            correct_answer,
            test_cases
          )
        `)
        .eq('test_id', testId)
        .order('question_order');

      if (error) throw error;
      setTestQuestions(data || []);
    } catch (err) {
      console.error('Failed to load test details:', err);
    }
  };

  const handleViewDetails = async (test) => {
    setSelectedTest(test);
    await loadTestDetails(test.id);
    setShowDetailsModal(true);
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      test_type: test.test_type,
      class_id: test.class_id,
      scheduled_at: test.scheduled_at ? new Date(test.scheduled_at).toISOString().slice(0, 16) : '',
      duration: test.duration
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.class_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('tests')
        .update({
          title: formData.title,
          test_type: formData.test_type,
          class_id: formData.class_id,
          scheduled_at: formData.scheduled_at || null,
          duration: parseInt(formData.duration)
        })
        .eq('id', editingTest.id);

      if (error) throw error;
      alert('Test updated successfully!');
      setShowEditModal(false);
      loadTests(user);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this test? This will also remove all associated question mappings.')) return;

    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Test deleted successfully!');
      loadTests(user);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getTotalMarks = () => {
    return testQuestions.reduce((sum, tq) => sum + (tq.questions?.marks || 0), 0);
  };

  const getTestStatus = (scheduledAt) => {
    if (!scheduledAt) return { label: 'Not Scheduled', color: 'bg-gray-500' };
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    if (scheduled > now) return { label: 'Upcoming', color: 'bg-blue-500' };
    return { label: 'Completed', color: 'bg-green-500' };
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Tests</h1>
              <p className="text-gray-600">View and manage all created tests</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/create-test')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Test
            </button>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const status = getTestStatus(test.scheduled_at);
            return (
              <div key={test.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase text-white ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        test.test_type === 'mcq'
                          ? 'bg-green-100 text-green-700'
                          : test.test_type === 'short_answer'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {test.test_type.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
                  
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{test.classes?.name || 'No Class Assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{test.duration} minutes</span>
                    </div>
                    {test.scheduled_at && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(test.scheduled_at).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>By {test.users?.name}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(test)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(test)}
                      className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t">
                  Created: {new Date(test.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}

          {tests.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No tests found. Create your first test!</p>
              <button
                onClick={() => router.push('/dashboard/create-test')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Create Test
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTest.title}</h2>
                  <p className="text-gray-600">Test Details and Questions</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-blue-600">{testQuestions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="text-2xl font-bold text-blue-600">{getTotalMarks()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTest.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTest.classes?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4">Questions</h3>
              <div className="space-y-4">
                {testQuestions.map((tq, index) => (
                  <div key={tq.questions.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                              tq.questions.question_type === 'mcq'
                                ? 'bg-green-100 text-green-700'
                                : tq.questions.question_type === 'short_answer'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {tq.questions.question_type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-600">
                            {tq.questions.marks} {tq.questions.marks === 1 ? 'Mark' : 'Marks'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{tq.questions.title}</h4>
                        <p className="text-gray-700 text-sm">{tq.questions.description}</p>

                        {tq.questions.question_type === 'mcq' && tq.questions.options && (
                          <div className="mt-2 bg-white p-3 rounded">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Options:</p>
                            {JSON.parse(tq.questions.options).map((opt, idx) => (
                              <p key={idx} className="text-sm text-gray-700">
                                {String.fromCharCode(65 + idx)}. {opt}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">Edit Test</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Test Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                    placeholder="Enter test title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Test Type *</label>
                  <select
                    value={formData.test_type}
                    onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="coding">Coding</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class *</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    min="1"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                    placeholder="e.g., 30"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Update Test
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
