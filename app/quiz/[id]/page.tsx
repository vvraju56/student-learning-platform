'use client';

import { useContext, useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { MonitoringContext } from '@/context/MonitoringContext';
import Navigation from '@/components/Navigation';
import { quizzes } from '@/data/quizzes';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout, loading } = useContext(AuthContext);
  const { addQuizScore } = useContext(MonitoringContext);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const id = params?.id as string;
  const quiz = quizzes.find((q) => q.materialId === id);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const score = useMemo(() => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  }, [quiz, selectedAnswers]);

  if (loading || !user || !quiz) return null;

  const question = quiz.questions[currentQuestion];

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answerIndex,
    }));
  };

  const handleNext = async () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsSubmitting(true);
      try {
        await addQuizScore(score);
        setShowResults(true);
      } catch (error) {
        console.error('Error submitting quiz score:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReview = () => {
    router.push(`/content/${id}`);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation user={user} onLogout={logout} />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Quiz Complete!</h1>
            
            <div className={`text-6xl font-bold mb-6 ${score >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
              {score}%
            </div>

            <div className="text-lg text-gray-700 mb-8">
              {score >= 50 ? (
                <>
                  <p className="font-semibold mb-2">Good job!</p>
                  <p>You've demonstrated a solid understanding of the material.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-2">Review Recommended</p>
                  <p>We recommend reviewing the content before moving forward.</p>
                </>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleReview}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Review Content
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation user={user} onLogout={logout} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-800">Question {currentQuestion + 1} of {quiz.questions.length}</h2>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">{question.question}</h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion] === undefined || isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isSubmitting ? 'Submitting...' : currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}
