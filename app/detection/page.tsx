'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { MonitoringContext } from '@/context/MonitoringContext';
import Navigation from '@/components/Navigation';
import { WebcamDetector } from '@/components/WebcamDetector';

export default function DetectionPage() {
  const router = useRouter();
  const { user, logout, loading } = useContext(AuthContext);
  const { monitoring } = useContext(MonitoringContext);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation user={user} onLogout={logout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Real-time Detection</h1>
          <p className="text-gray-600 mt-2">Posture and Attention Monitoring with Webcam</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Webcam Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Webcam Feed</h2>
              <WebcamDetector />
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-6">
            {/* Posture Card */}
            <div className={`rounded-lg shadow-lg p-6 text-white ${
              monitoring.postureScore > 70 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-orange-600'
            }`}>
              <h3 className="text-lg font-semibold mb-2">Posture Status</h3>
              <p className="text-4xl font-bold mb-2">{monitoring.postureScore}%</p>
              <p className="text-sm opacity-90 capitalize">{monitoring.posture.replace('_', ' ')}</p>
            </div>

            {/* Attention Card */}
            <div className={`rounded-lg shadow-lg p-6 text-white ${
              monitoring.attentionScore > 70 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              <h3 className="text-lg font-semibold mb-2">Attention Status</h3>
              <p className="text-4xl font-bold mb-2">{monitoring.attentionScore}%</p>
              <p className="text-sm opacity-90 capitalize">{monitoring.attention.replace('_', ' ')}</p>
            </div>

            {/* Study Duration */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Study Duration</h3>
              <p className="text-3xl font-bold text-gray-600">{monitoring.studyDuration}m</p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Posture Tips</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ Sit with shoulders relaxed</li>
              <li>✓ Keep back straight against chair</li>
              <li>✓ Position screen at eye level</li>
              <li>✓ Feet flat on ground</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Attention Tips</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ Minimize distractions</li>
              <li>✓ Take regular breaks</li>
              <li>✓ Stay hydrated</li>
              <li>✓ Focus on the screen</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
