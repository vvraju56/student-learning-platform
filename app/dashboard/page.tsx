'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { MonitoringContext } from '@/context/MonitoringContext';
import Navigation from '@/components/Navigation';
import DashboardCards from '@/components/DashboardCards';
import AlertPopup from '@/components/AlertPopup';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading } = useContext(AuthContext);
  const { monitoring, addAlert, alerts } = useContext(MonitoringContext);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Generate alerts when status changes to bad
  useEffect(() => {
    if (monitoring.posture === 'leaning_forward' && Math.random() > 0.7) {
      const newAlert = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'posture' as const,
        message: 'Leaning forward detected',
        severity: 'warning' as const,
      };
      addAlert(newAlert);
    }

    if (monitoring.attention === 'distracted' && Math.random() > 0.7) {
      const newAlert = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'attention' as const,
        message: 'Distraction detected',
        severity: 'warning' as const,
      };
      addAlert(newAlert);
    }
  }, [monitoring.posture, monitoring.attention, addAlert]);

  if (loading || !user) return null;

  const recentAlert = alerts[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Welcome back, {user.displayName}!</h1>
          <p className="text-gray-600 mt-2">Monitor your learning progress in real-time</p>
        </div>

        {/* Status Cards */}
        <DashboardCards monitoring={monitoring} />

        {/* Alert Notification */}
        {recentAlert && (
          <AlertPopup
            alert={recentAlert}
            onClose={() => {}}
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Study Duration</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{monitoring.studyDuration}m</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Alerts</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{alerts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Average Focus</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{Math.round(monitoring.attentionScore)}%</p>
          </div>
        </div>
      </main>
    </div>
  );
}
