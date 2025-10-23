'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import { supabase } from '@/app/utils/supabase';

export default function CreateTestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    test_type: 'mcq',
    class_id: '',
    scheduled_at: '',
    duration: 60
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
        loadClasses(userData);
        loadQuestions(userData);
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
      
      if (userData.role === 'teacher') {
        query = query.eq('teacher_id', userData.id);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadQuestions = async (userData) => {
    try {
      let query = supabase.from('questions').select('*').order('created_at', { ascending: false });

      if (userData.role === 'teacher') {
        query = query.eq('created_by', userData.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const toggleQuestion = (questionId) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question for the test');
      return;
    }

    try {
      // Create test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{
          title: formData.title,
          test_type: formData.test_type,
          class_id: formData.class_id || null,
          scheduled_at: formData.scheduled_at || null,
          duration: parseInt(formData.duration),
          created_by: user.id
        }])
        .select()
        .single();

      if (testError) throw testError;

      // Link questions to test
      const testQuestions = selectedQuestions.map((questionId, index) => ({
        test_id: testData.id,
        question_id: questionId,
        question_order: index + 1
      }));

      const { error: linkError } = await supabase
        .from('test_questions')
        .insert(testQuestions);

      if (linkError) throw linkError;

      alert('Test created successfully!');
      router.push('/dashboard/manage-tests');
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
    return questions
      .filter(q => selectedQuestions.includes(q.id))
      .reduce((sum, q) => sum + (q.marks || 0), 0);
  };

  const filteredQuestions = questions.filter(q => 
    filterType === 'all' || q.question_type === filterType
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Test</h1>
          <p className="text-gray-600">Configure test details and select questions</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Test Configuration */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Test Configuration</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="e.g., Mid-Term Exam"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Type *</label>
                  <select
                    required
                    value={formData.test_type}
                    onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Selected Questions:</span>
                    <span className="text-lg font-bold text-blue-600">{selectedQuestions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Marks:</span>
                    <span className="text-lg font-bold text-blue-600">{getTotalMarks()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Test
                </button>
              </div>
            </div>

            {/* Right: Question Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Questions</h2>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('mcq')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'mcq' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    MCQ ({questions.filter(q => q.question_type === 'mcq').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('short_answer')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'short_answer' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Short Answer ({questions.filter(q => q.question_type === 'short_answer').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('coding')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'coding' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Coding ({questions.filter(q => q.question_type === 'coding').length})
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => toggleQuestion(question.id)}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
                      selectedQuestions.includes(question.id)
                        ? 'ring-4 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestion(question.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                              question.question_type === 'mcq'
                                ? 'bg-green-100 text-green-700'
                                : question.question_type === 'short_answer'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {question.question_type.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-semibold text-gray-600">
                            {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{question.title}</h3>
                        <p className="text-gray-700 text-sm">{question.description}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredQuestions.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">
                      No questions available. Please create questions first.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/manage-questions')}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Go to Manage Questions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
