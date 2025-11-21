'use client';

import { useContext, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { MonitoringContext } from '@/context/MonitoringContext';
import Navigation from '@/components/Navigation';
import ReportsChart from '@/components/ReportsChart';

export default function ReportsPage() {
  const router = useRouter();
  const { user, logout, loading } = useContext(AuthContext);
  const { quizScores, alerts } = useContext(MonitoringContext);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const stats = useMemo(() => {
    const postureAlerts = alerts.filter((a) => a.type === 'posture').length;
    const attentionAlerts = alerts.filter((a) => a.type === 'attention').length;
    
    const averageQuizScore = quizScores.length > 0
      ? Math.round(quizScores.reduce((a: number, b: number) => a + b) / quizScores.length)
      : 0;

    const postureScore = 85 - (postureAlerts * 2);
    const attentionScore = 90 - (attentionAlerts * 2);

    return {
      postureScore: Math.max(0, postureScore),
      attentionScore: Math.max(0, attentionScore),
      averageQuizScore,
      totalAlerts: alerts.length,
      quizAttempts: quizScores.length,
      studyDuration: Math.round(Math.random() * 100 + 20),
    };
  }, [quizScores, alerts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Reports & Progress</h1>
          <p className="text-gray-600 mt-2">Track your learning and monitoring statistics</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Posture Score</h3>
            <p className="text-4xl font-bold text-orange-600 mt-2">{stats.postureScore}</p>
            <p className="text-xs text-gray-500 mt-2">Out of 100</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Attention Score</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.attentionScore}</p>
            <p className="text-xs text-gray-500 mt-2">Out of 100</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Avg Quiz Score</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{stats.averageQuizScore}%</p>
            <p className="text-xs text-gray-500 mt-2">{stats.quizAttempts} quizzes</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Study Hours</h3>
            <p className="text-4xl font-bold text-purple-600 mt-2">{stats.studyDuration}h</p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Study Hours</h3>
            <ReportsChart type="line" />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monitoring Statistics</h3>
            <ReportsChart type="bar" />
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Posture Violations</span>
                <span className="font-bold text-orange-600">{alerts.filter((a) => a.type === 'posture').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Attention Lapses</span>
                <span className="font-bold text-yellow-600">{alerts.filter((a) => a.type === 'attention').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Alerts</span>
                <span className="font-bold text-gray-800">{stats.totalAlerts}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Quizzes Attempted</span>
                <span className="font-bold text-blue-600">{stats.quizAttempts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Average Score</span>
                <span className="font-bold text-green-600">{stats.averageQuizScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Highest Score</span>
                <span className="font-bold text-gray-800">{quizScores.length > 0 ? Math.max(...quizScores) : 'N/A'}%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
