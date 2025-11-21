'use client';

import { useState, useEffect } from 'react';

export interface AttentionMetrics {
  attention: 'focused' | 'distracted';
  attentionScore: number;
  eyeGazeDirection: 'forward' | 'left' | 'right' | 'down';
  headMovement: number;
}

export function useAttentionDetection() {
  const [attentionMetrics, setAttentionMetrics] = useState<AttentionMetrics>({
    attention: 'focused',
    attentionScore: 90,
    eyeGazeDirection: 'forward',
    headMovement: 0,
  });

  // Simulate attention metrics (in production, use eye-tracking library like WebGazer.js)
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      const attentionScore = Math.min(100, Math.max(50, 85 + (Math.random() - 0.5) * 40));
      
      setAttentionMetrics({
        attention: attentionScore > 70 ? 'focused' : 'distracted',
        attentionScore: Math.round(attentionScore),
        eyeGazeDirection: random > 0.8 ? 'down' : random > 0.6 ? 'left' : 'forward',
        headMovement: Math.round(Math.random() * 10),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return attentionMetrics;
}
