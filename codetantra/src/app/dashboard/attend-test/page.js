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
  const [submitting, setSubmitting] = useState(false);
  const [testStatuses, setTestStatuses] = useState({});
  const [codingLanguages, setCodingLanguages] = useState({}); // Track selected language per question
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

      // Check submission status for each test
      const statuses = {};
      for (const test of tests || []) {
        const { data: submissions, error: subError } = await supabase
          .from('submissions')
          .select('id, status')
          .eq('test_id', test.id)
          .eq('student_id', userData.id)
          .limit(1);

        if (!subError && submissions && submissions.length > 0) {
          statuses[test.id] = 'completed';
        } else {
          statuses[test.id] = 'available';
        }
      }

      setTestStatuses(statuses);
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
    // Check if already completed or has malpractice
    if (testStatuses[test.id] === 'completed') {
      alert('You have already completed this test!');
      return;
    }

    // Confirm start
    if (!confirm('Once you start the test, you cannot close the window until submission. Any attempt to close will be marked as malpractice. Do you want to proceed?')) {
      return;
    }

    setSelectedTest(test);
    await loadTestQuestions(test.id);
    setAnswers({});
    setTimeRemaining(test.duration * 60);
    setTestStarted(true);
    setShowTestModal(true);

    // Enter fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }

    // Prevent closing/navigation
    window.onbeforeunload = () => {
      return 'Test is in progress. Closing will mark as malpractice!';
    };
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleLanguageChange = (questionId, language) => {
    setCodingLanguages({
      ...codingLanguages,
      [questionId]: language
    });
  };

  const getLanguageTemplate = (language) => {
    const templates = {
      c: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
      java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}`,
      python: `# Write your code here\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`
    };
    return templates[language] || '';
  };

  const handleSubmitTest = async () => {
    if (!confirm('Are you sure you want to submit the test? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare submissions for all questions
      const submissions = testQuestions.map((tq) => {
        const question = tq.questions;
        const studentAnswer = answers[question.id] || '';

        let status = 'pending';
        let score = 0;

        // Auto-grade MCQ
        if (question.question_type === 'mcq' && question.correct_answer) {
          if (studentAnswer.trim().toUpperCase() === question.correct_answer.trim().toUpperCase()) {
            status = 'correct';
            score = question.marks;
          } else {
            status = 'incorrect';
            score = 0;
          }
        }

        return {
          test_id: selectedTest.id,
          question_id: question.id,
          student_id: user.id,
          answer: studentAnswer,
          status: status,
          score: score,
          submitted_at: new Date().toISOString()
        };
      });

      // Insert all submissions
      const { error } = await supabase
        .from('submissions')
        .insert(submissions);

      if (error) throw error;

      // Remove beforeunload warning
      window.onbeforeunload = null;

      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }

      alert('Test submitted successfully! Your answers have been recorded.');
      
      setShowTestModal(false);
      setTestStarted(false);
      setSelectedTest(null);
      setTestQuestions([]);
      setAnswers({});
      
      // Reload tests to update status
      loadAvailableTests(user);
    } catch (err) {
      alert('Error submitting test: ' + err.message);
    } finally {
      setSubmitting(false);
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

  const getTestStatus = (scheduledAt, testId) => {
    // Check if completed
    if (testStatuses[testId] === 'completed') {
      return { label: 'Completed', color: 'bg-gray-500', canStart: false };
    }

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
            const status = getTestStatus(test.scheduled_at, test.id);
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
                    {status.label === 'Completed' ? 'Already Completed' : status.canStart ? 'Start Test' : 'Not Available Yet'}
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

      {/* Test Taking Modal - Fullscreen */}
      {showTestModal && selectedTest && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-[9999] overflow-hidden">
          <div className="h-screen flex flex-col">
            {/* Fixed Header with Timer */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedTest.title}</h2>
                    <p className="text-blue-100 text-sm">
                      <span className="inline-block mr-4">📝 {testQuestions.length} Questions</span>
                      <span className="inline-block">✅ Answered: {Object.keys(answers).length}</span>
                    </p>
                  </div>
                  <div className="text-center bg-white bg-opacity-20 rounded-lg px-6 py-3">
                    <p className="text-xs text-blue-100 mb-1">Time Remaining</p>
                    <p className={`text-4xl font-bold tabular-nums ${timeRemaining < 60 ? 'text-red-300 animate-pulse' : ''}`}>
                      {formatTime(timeRemaining)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Warning Banner */}
              <div className="bg-red-600 text-white py-2 px-6">
                <p className="text-center text-sm font-semibold">
                  ⚠️ Do not close this window or navigate away. Doing so will mark this test as malpractice!
                </p>
              </div>
            </div>

            {/* Scrollable Questions Area */}
            <div className="flex-1 overflow-y-auto bg-gray-100">
              <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="space-y-6">
                  {testQuestions.map((tq, index) => (
                    <div key={tq.questions.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                                {tq.questions.marks} {tq.questions.marks === 1 ? 'Mark' : 'Marks'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                tq.questions.question_type === 'mcq' ? 'bg-green-400 text-green-900' :
                                tq.questions.question_type === 'short_answer' ? 'bg-purple-400 text-purple-900' :
                                'bg-orange-400 text-orange-900'
                              }`}>
                                {tq.questions.question_type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h4 className="font-bold text-gray-900 mb-3 text-xl">{tq.questions.title}</h4>
                        <p className="text-gray-700 mb-6 text-lg leading-relaxed">{tq.questions.description}</p>

                        {/* MCQ Options */}
                        {tq.questions.question_type === 'mcq' && tq.questions.options && (
                          <div className="space-y-3">
                            {JSON.parse(tq.questions.options).map((opt, idx) => (
                              <label
                                key={idx}
                                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  answers[tq.questions.id] === String.fromCharCode(65 + idx)
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${tq.questions.id}`}
                                  value={String.fromCharCode(65 + idx)}
                                  checked={answers[tq.questions.id] === String.fromCharCode(65 + idx)}
                                  onChange={(e) => handleAnswerChange(tq.questions.id, e.target.value)}
                                  className="w-5 h-5 text-blue-600 mt-1"
                                />
                                <span className="text-gray-900 flex-1 text-lg">
                                  <strong className="text-blue-600">{String.fromCharCode(65 + idx)}.</strong> {opt}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Short Answer */}
                        {tq.questions.question_type === 'short_answer' && (
                          <textarea
                            rows="5"
                            value={answers[tq.questions.id] || ''}
                            onChange={(e) => handleAnswerChange(tq.questions.id, e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black text-lg"
                            placeholder="Type your answer here..."
                          />
                        )}

                        {/* Coding */}
                        {tq.questions.question_type === 'coding' && (
                          <div className="bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
                            {/* Code Editor Header */}
                            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-gray-400 text-sm ml-3 font-mono">Solution.{codingLanguages[tq.questions.id] || 'cpp'}</span>
                              </div>
                              
                              {/* Language Selector */}
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">Language:</span>
                                <select
                                  value={codingLanguages[tq.questions.id] || 'cpp'}
                                  onChange={(e) => {
                                    handleLanguageChange(tq.questions.id, e.target.value);
                                    if (!answers[tq.questions.id]) {
                                      handleAnswerChange(tq.questions.id, getLanguageTemplate(e.target.value));
                                    }
                                  }}
                                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="c">C</option>
                                  <option value="cpp">C++</option>
                                  <option value="java">Java</option>
                                  <option value="python">Python</option>
                                </select>
                              </div>
                            </div>

                            {/* Code Editor Body */}
                            <div className="relative">
                              {/* Line Numbers */}
                              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 text-gray-500 text-right pr-3 py-4 font-mono text-sm select-none border-r border-gray-700">
                                {(answers[tq.questions.id] || getLanguageTemplate(codingLanguages[tq.questions.id] || 'cpp')).split('\n').map((_, i) => (
                                  <div key={i} className="leading-6">{i + 1}</div>
                                ))}
                              </div>

                              {/* Code Textarea */}
                              <textarea
                                value={answers[tq.questions.id] || getLanguageTemplate(codingLanguages[tq.questions.id] || 'cpp')}
                                onChange={(e) => handleAnswerChange(tq.questions.id, e.target.value)}
                                className="w-full pl-16 pr-4 py-4 bg-gray-900 text-gray-100 font-mono text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows="18"
                                spellCheck="false"
                                style={{
                                  tabSize: 4,
                                  caretColor: '#60A5FA'
                                }}
                              />
                            </div>

                            {/* Code Editor Footer */}
                            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-700">
                              <div className="flex items-center gap-4">
                                <span>Lines: {(answers[tq.questions.id] || '').split('\n').length}</span>
                                <span>Characters: {(answers[tq.questions.id] || '').length}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="uppercase">{codingLanguages[tq.questions.id] || 'cpp'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="bg-white border-t-4 border-blue-500 shadow-2xl">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-gray-700">
                    <p className="text-sm mb-1">Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="w-64 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${(Object.keys(answers).length / testQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">
                        {Object.keys(answers).length} / {testQuestions.length}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmitTest}
                    disabled={submitting}
                    className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                      submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {submitting ? 'Submitting...' : '✓ Submit Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
