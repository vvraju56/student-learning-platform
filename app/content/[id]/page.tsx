'use client';

import { useContext, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { MonitoringContext } from '@/context/MonitoringContext';
import Navigation from '@/components/Navigation';
import { studyMaterials } from '@/data/studyMaterials';

export default function ContentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout, loading } = useContext(AuthContext);
  const { monitoring } = useContext(MonitoringContext);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const id = params?.id as string;
  const material = studyMaterials.find((m) => m.id === id);

  if (loading || !user) return null;
  if (!material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation user={user} onLogout={logout} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600 text-lg">Content not found</p>
        </main>
      </div>
    );
  }

  const handleStartQuiz = () => {
    router.push(`/quiz/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation user={user} onLogout={logout} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{material.title}</h1>
          <p className="text-gray-600">{material.subject} • {material.duration} minutes</p>
        </div>

        {/* Real-time Warnings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg font-semibold text-white ${
            monitoring.posture === 'good' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            Posture: {monitoring.posture === 'good' ? '✓ Good' : '⚠ Leaning Forward'}
          </div>
          <div className={`p-4 rounded-lg font-semibold text-white ${
            monitoring.attention === 'focused' ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            Focus: {monitoring.attention === 'focused' ? '✓ Focused' : '⚠ Distracted'}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">{material.content}</p>
            {material.videoUrl && (
              <div className="my-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Video Lecture</h3>
                <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                  <span className="text-gray-600">Video content would be embedded here</span>
                </div>
              </div>
            )}
            {material.imageUrl && (
              <div className="my-6">
                <img
                  src="/study-material.jpg"
                  alt={material.title}
                  className="rounded-lg w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Quiz Button */}
        <button
          onClick={handleStartQuiz}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
        >
          Start Quiz
        </button>
      </main>
    </div>
  );
}
