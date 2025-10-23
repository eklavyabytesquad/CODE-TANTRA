'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByToken } from '@/app/utils/auth';
import DashboardNavbar from '@/components/dashboard/navbar';
import { supabase } from '@/app/utils/supabase';

export default function AttendTestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, timeRemaining]);

  const loadUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const userData = await getUserByToken(token);
      if (!userData || userData.role !== 'student') {
        router.push('/dashboard');
      } else {
        setUser(userData);
        loadAvailableTests(userData);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTests = async (userData) => {
    try {
      // First, get the classes the student is enrolled in
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', userData.id);

      if (enrollError) throw enrollError;

      const classIds = enrollments.map(e => e.class_id);

      if (classIds.length === 0) {
        setAvailableTests([]);
        return;
      }

      // Get tests for those classes
      const { data: tests, error: testsError } = await supabase
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
        .in('class_id', classIds)
        .order('scheduled_at', { ascending: true });

      if (testsError) throw testsError;
      setAvailableTests(tests || []);
    } catch (err) {
      console.error('Failed to load available tests:', err);
    }
  };

  const loadTestQuestions = async (testId) => {
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
            test_cases
          )
        `)
        .eq('test_id', testId)
        .order('question_order');

      if (error) throw error;
      setTestQuestions(data || []);
    } catch (err) {
      console.error('Failed to load test questions:', err);
    }
  };

  const handleStartTest = async (test) => {
    setSelectedTest(test);
    await loadTestQuestions(test.id);
    setAnswers({});
    setTimeRemaining(test.duration * 60); // Convert minutes to seconds
    setTestStarted(true);
    setShowTestModal(true);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmitTest = async () => {
    if (!confirm('Are you sure you want to submit the test? You cannot change your answers after submission.')) {
      return;
    }

    try {
      // Here you would save the answers to a submissions table
      // For now, we'll just show an alert
      const answeredCount = Object.keys(answers).length;
      const totalQuestions = testQuestions.length;
      
      alert(`Test submitted successfully!\nAnswered: ${answeredCount}/${totalQuestions} questions`);
      
      setShowTestModal(false);
      setTestStarted(false);
      setSelectedTest(null);
      setTestQuestions([]);
      setAnswers({});
    } catch (err) {
      alert('Error submitting test: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTestStatus = (scheduledAt) => {
    if (!scheduledAt) return { label: 'Available', color: 'bg-green-500', canStart: true };
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    if (scheduled > now) return { label: 'Upcoming', color: 'bg-blue-500', canStart: false };
    return { label: 'Available', color: 'bg-green-500', canStart: true };
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attend Test</h1>
          <p className="text-gray-600">Select a test to begin</p>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTests.map((test) => {
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
                      <span>{test.classes?.name}</span>
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

                  <button
                    onClick={() => handleStartTest(test)}
                    disabled={!status.canStart}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      status.canStart
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {status.canStart ? 'Start Test' : 'Not Available Yet'}
                  </button>
                </div>
              </div>
            );
          })}

          {availableTests.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No tests available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Please check back later or contact your teacher.</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Taking Modal */}
      {showTestModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            {/* Header with Timer */}
            <div className="p-6 border-b bg-blue-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedTest.title}</h2>
                  <p className="text-blue-100">Answer all questions carefully</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-100">Time Remaining</p>
                  <p className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-300' : ''}`}>
                    {formatTime(timeRemaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {testQuestions.map((tq, index) => (
                  <div key={tq.questions.id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">
                            {tq.questions.marks} {tq.questions.marks === 1 ? 'Mark' : 'Marks'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2 text-lg">{tq.questions.title}</h4>
                        <p className="text-gray-700 mb-4">{tq.questions.description}</p>

                        {/* MCQ Options */}
                        {tq.questions.question_type === 'mcq' && tq.questions.options && (
                          <div className="space-y-2">
                            {JSON.parse(tq.questions.options).map((opt, idx) => (
                              <label
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-colors"
                              >
                                <input
                                  type="radio"
                                  name={`question-${tq.questions.id}`}
                                  value={String.fromCharCode(65 + idx)}
                                  checked={answers[tq.questions.id] === String.fromCharCode(65 + idx)}
                                  onChange={(e) => handleAnswerChange(tq.questions.id, e.target.value)}
                                  className="w-5 h-5 text-blue-600"
                                />
                                <span className="text-gray-900">
                                  <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Short Answer */}
                        {tq.questions.question_type === 'short_answer' && (
                          <textarea
                            rows="4"
                            value={answers[tq.questions.id] || ''}
                            onChange={(e) => handleAnswerChange(tq.questions.id, e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                            placeholder="Type your answer here..."
                          />
                        )}

                        {/* Coding */}
                        {tq.questions.question_type === 'coding' && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Write your code solution:</p>
                            <textarea
                              rows="10"
                              value={answers[tq.questions.id] || ''}
                              onChange={(e) => handleAnswerChange(tq.questions.id, e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black font-mono text-sm"
                              placeholder="// Write your code here..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-lg">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                  Answered: <strong>{Object.keys(answers).length}</strong> / {testQuestions.length}
                </p>
              </div>
              <button
                onClick={handleSubmitTest}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
