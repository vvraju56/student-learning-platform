'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { MonitoringContext } from '@/context/MonitoringContext';
import Navigation from '@/components/Navigation';

export default function AlertsPage() {
  const router = useRouter();
  const { user, logout, loading } = useContext(AuthContext);
  const { alerts, clearAlerts } = useContext(MonitoringContext);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const sortedAlerts = [...alerts].reverse();

  const alertCounts = {
    posture: sortedAlerts.filter((a) => a.type === 'posture').length,
    attention: sortedAlerts.filter((a) => a.type === 'attention').length,
  };

  const handleClearAlerts = async () => {
    setIsClearing(true);
    try {
      await clearAlerts();
    } catch (error) {
      console.error(' Error clearing alerts:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Alerts & Monitoring</h1>
          <p className="text-gray-600 mt-2">Review all posture and attention alerts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Alerts</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{sortedAlerts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Posture Issues</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{alertCounts.posture}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Attention Issues</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{alertCounts.attention}</p>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Message</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.length > 0 ? (
                  sortedAlerts.map((alert, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-700">{alert.timestamp}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.type === 'posture'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{alert.message}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No alerts yet. Keep up the good work!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clear Button */}
        {sortedAlerts.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleClearAlerts}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              {isClearing ? 'Clearing...' : 'Clear All Alerts'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
