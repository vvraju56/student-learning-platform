'use client';

import { usePostureDetection } from '@/hooks/usePostureDetection';
import { useAttentionDetection } from '@/hooks/useAttentionDetection';
import { useEffect, useContext } from 'react';
import { MonitoringContext } from '@/context/MonitoringContext';

export function WebcamDetector() {
  const { videoRef, canvasRef, postureData, isInitialized, error } = usePostureDetection();
  const attentionMetrics = useAttentionDetection();
  const { updateMonitoring } = useContext(MonitoringContext);

  useEffect(() => {
    if (isInitialized) {
      updateMonitoring({
        posture: postureData.posture,
        postureScore: postureData.postureScore,
        attention: attentionMetrics.attention,
        attentionScore: attentionMetrics.attentionScore,
      });
    }
  }, [postureData, attentionMetrics, isInitialized, updateMonitoring]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Camera Access Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden">
        <video ref={videoRef} width={640} height={480} style={{ transform: 'scaleX(-1)' }} />
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full border-2 border-blue-500 rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />

      {isInitialized && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Spine Angle</p>
            <p className="text-2xl font-bold text-blue-600">{postureData.angle}°</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Eye Gaze</p>
            <p className="text-lg font-semibold text-green-600 capitalize">
              {attentionMetrics.eyeGazeDirection}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
