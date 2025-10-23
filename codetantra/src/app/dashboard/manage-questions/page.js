'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import { supabase } from '@/app/utils/supabase';

export default function ManageQuestionsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionType, setQuestionType] = useState('mcq');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    question_type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    test_cases: [{ input: '', output: '' }],
    marks: 1
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
        loadQuestions(userData);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (userData) => {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      question_type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      test_cases: [{ input: '', output: '' }],
      marks: 1
    });
    setQuestionType('mcq');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        title: formData.title,
        description: formData.description,
        question_type: formData.question_type,
        marks: parseInt(formData.marks),
        created_by: user.id
      };

      if (formData.question_type === 'mcq') {
        questionData.options = JSON.stringify(formData.options.filter(opt => opt.trim()));
        questionData.correct_answer = formData.correct_answer;
        questionData.test_cases = null;
      } else if (formData.question_type === 'short_answer') {
        questionData.correct_answer = formData.correct_answer;
        questionData.options = null;
        questionData.test_cases = null;
      } else if (formData.question_type === 'coding') {
        questionData.test_cases = JSON.stringify(formData.test_cases.filter(tc => tc.input || tc.output));
        questionData.options = null;
        questionData.correct_answer = null;
      }

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        alert('Question updated successfully!');
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([questionData]);
        if (error) throw error;
        alert('Question created successfully!');
      }

      setShowModal(false);
      resetForm();
      setEditingQuestion(null);
      loadQuestions(user);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setQuestionType(question.question_type);
    
    const editData = {
      title: question.title,
      description: question.description,
      question_type: question.question_type,
      marks: question.marks,
      options: ['', '', '', ''],
      correct_answer: '',
      test_cases: [{ input: '', output: '' }]
    };

    if (question.question_type === 'mcq') {
      editData.options = question.options ? JSON.parse(question.options) : ['', '', '', ''];
      editData.correct_answer = question.correct_answer || '';
    } else if (question.question_type === 'short_answer') {
      editData.correct_answer = question.correct_answer || '';
    } else if (question.question_type === 'coding') {
      editData.test_cases = question.test_cases ? JSON.parse(question.test_cases) : [{ input: '', output: '' }];
    }

    setFormData(editData);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Question deleted successfully!');
      loadQuestions(user);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      test_cases: [...formData.test_cases, { input: '', output: '' }]
    });
  };

  const removeTestCase = (index) => {
    const newTestCases = formData.test_cases.filter((_, i) => i !== index);
    setFormData({ ...formData, test_cases: newTestCases });
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Questions</h1>
              <p className="text-gray-600">Create and manage questions for tests</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingQuestion(null);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Question
            </button>
          </div>
        </div>

        {/* Filter by Type */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setQuestionType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                questionType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Questions ({questions.length})
            </button>
            <button
              onClick={() => setQuestionType('mcq')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                questionType === 'mcq' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              MCQ ({questions.filter(q => q.question_type === 'mcq').length})
            </button>
            <button
              onClick={() => setQuestionType('short_answer')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                questionType === 'short_answer' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Short Answer ({questions.filter(q => q.question_type === 'short_answer').length})
            </button>
            <button
              onClick={() => setQuestionType('coding')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                questionType === 'coding' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Coding ({questions.filter(q => q.question_type === 'coding').length})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions
            .filter(q => questionType === 'all' || q.question_type === questionType)
            .map((question) => (
              <div key={question.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
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
                      <span className="text-sm text-gray-600">
                        {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{question.title}</h3>
                    <p className="text-gray-700 mb-3">{question.description}</p>

                    {question.question_type === 'mcq' && question.options && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Options:</p>
                        <ul className="space-y-1">
                          {JSON.parse(question.options).map((opt, idx) => (
                            <li key={idx} className="text-gray-600">
                              {String.fromCharCode(65 + idx)}. {opt}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          Correct Answer: {question.correct_answer}
                        </p>
                      </div>
                    )}

                    {question.question_type === 'short_answer' && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700">Expected Answer:</p>
                        <p className="text-gray-600">{question.correct_answer}</p>
                      </div>
                    )}

                    {question.question_type === 'coding' && question.test_cases && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Test Cases:</p>
                        {JSON.parse(question.test_cases).map((tc, idx) => (
                          <div key={idx} className="bg-white p-2 rounded mb-2 text-sm">
                            <span className="text-gray-600">Input: </span>
                            <code className="bg-gray-100 px-2 py-1 rounded">{tc.input}</code>
                            <span className="text-gray-600 ml-4">Output: </span>
                            <code className="bg-gray-100 px-2 py-1 rounded">{tc.output}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(question)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-4">
                  Created: {new Date(question.created_at).toLocaleString()}
                </div>
              </div>
            ))}

          {questions.filter(q => questionType === 'all' || q.question_type === questionType).length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No questions found. Click "Create New Question" to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingQuestion ? 'Edit Question' : 'Create New Question'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                <select
                  required
                  value={formData.question_type}
                  onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="coding">Coding Problem</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  placeholder="Enter question title"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  placeholder="Enter detailed question description"
                />
              </div>

              {formData.question_type === 'mcq' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                    {formData.options.map((option, index) => (
                      <input
                        key={index}
                        type="text"
                        required
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black mb-2"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                    ))}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                    <select
                      required
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    >
                      <option value="">Select correct answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </>
              )}

              {formData.question_type === 'short_answer' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Answer *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="Enter the expected answer"
                  />
                </div>
              )}

              {formData.question_type === 'coding' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Cases *</label>
                  {formData.test_cases.map((testCase, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        required
                        value={testCase.input}
                        onChange={(e) => {
                          const newTestCases = [...formData.test_cases];
                          newTestCases[index].input = e.target.value;
                          setFormData({ ...formData, test_cases: newTestCases });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                        placeholder="Input"
                      />
                      <input
                        type="text"
                        required
                        value={testCase.output}
                        onChange={(e) => {
                          const newTestCases = [...formData.test_cases];
                          newTestCases[index].output = e.target.value;
                          setFormData({ ...formData, test_cases: newTestCases });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                        placeholder="Expected Output"
                      />
                      {formData.test_cases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    + Add Test Case
                  </button>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Marks *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                    setEditingQuestion(null);
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
