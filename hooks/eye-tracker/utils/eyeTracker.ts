export const LEFT_EYE_LANDMARKS = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];

export const RIGHT_EYE_LANDMARKS = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
];

export const LEFT_IRIS_LANDMARK = 468;
export const RIGHT_IRIS_LANDMARK = 473;

export const LEFT_EYE_CORNERS = { left: 33, right: 133 };
export const RIGHT_EYE_CORNERS = { left: 362, right: 263 };

export interface EyeData {
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  leftIris: { x: number; y: number };
  rightIris: { x: number; y: number };
  leftIrisNormalized: { x: number; y: number };
  rightIrisNormalized: { x: number; y: number };
}

export function getEyeLandmarks(
  faceLandmarks: { x: number; y: number; z: number }[],
  frameWidth: number,
  frameHeight: number
): EyeData {
  const leftEyePoints = LEFT_EYE_LANDMARKS.map(
    (idx) => faceLandmarks[idx]
  );
  const rightEyePoints = RIGHT_EYE_LANDMARKS.map(
    (idx) => faceLandmarks[idx]
  );

  const leftIris = faceLandmarks[LEFT_IRIS_LANDMARK];
  const rightIris = faceLandmarks[RIGHT_IRIS_LANDMARK];

  return {
    leftEye: leftEyePoints.map((p) => ({
      x: p.x * frameWidth,
      y: p.y * frameHeight,
    })),
    rightEye: rightEyePoints.map((p) => ({
      x: p.x * frameWidth,
      y: p.y * frameHeight,
    })),
    leftIris: {
      x: leftIris.x * frameWidth,
      y: leftIris.y * frameHeight,
    },
    rightIris: {
      x: rightIris.x * frameWidth,
      y: rightIris.y * frameHeight,
    },
    leftIrisNormalized: { x: leftIris.x, y: leftIris.y },
    rightIrisNormalized: { x: rightIris.x, y: rightIris.y },
  };
}

export function calculateGazeRatio(
  eyePoints: { x: number; y: number }[],
  irisPoint: { x: number; y: number }
): number {
  const xCoords = eyePoints.map((p) => p.x);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const eyeWidth = maxX - minX;

  if (eyeWidth === 0) return 0.5;

  const pupilLocation = (irisPoint.x - minX) / eyeWidth;
  return Math.max(0, Math.min(1, pupilLocation));
}

export function calculateVerticalGazeRatio(
  eyePoints: { x: number; y: number }[],
  irisPoint: { x: number; y: number }
): number {
  const yCoords = eyePoints.map((p) => p.y);
  const eyeTop = Math.min(...yCoords);
  const eyeBottom = Math.max(...yCoords);
  const eyeHeight = eyeBottom - eyeTop;

  if (eyeHeight === 0) return 0.5;

  const pupilVLocation = (irisPoint.y - eyeTop) / eyeHeight;
  return Math.max(0, Math.min(1, pupilVLocation));
}

export function getGazeDirection(
  leftGazeRatio: number,
  rightGazeRatio: number
): string {
  const avgGaze = (leftGazeRatio + rightGazeRatio) / 2;

  if (avgGaze < 0.4) return "LEFT";
  if (avgGaze > 0.6) return "RIGHT";
  return "CENTER";
}

export function getCombinedGazePosition(eyeData: EyeData): {
  x: number;
  y: number;
} {
  const gazeX =
    (eyeData.leftIrisNormalized.x + eyeData.rightIrisNormalized.x) / 2;
  const gazeY =
    (eyeData.leftIrisNormalized.y + eyeData.rightIrisNormalized.y) / 2;

  return { x: gazeX, y: gazeY };
}