export const LEFT_EYE_TOP = 159;
export const LEFT_EYE_BOTTOM = 145;
export const RIGHT_EYE_TOP = 386;
export const RIGHT_EYE_BOTTOM = 374;
export const LEFT_EYE_LEFT = 33;
export const LEFT_EYE_RIGHT = 133;
export const RIGHT_EYE_LEFT = 362;
export const RIGHT_EYE_RIGHT = 263;

export interface BlinkData {
  leftEar: number;
  rightEar: number;
  avgEar: number;
  blinkDetected: boolean;
  blinkCount: number;
  leftBlink: boolean;
  rightBlink: boolean;
  bothBlink: boolean;
  eyesClosed: boolean;
}

export function calculateEyeAspectRatio(
  landmarks: { x: number; y: number; z: number }[],
  frameWidth: number,
  frameHeight: number
): { leftEar: number; rightEar: number; avgEar: number } {
  const leftTop = landmarks[LEFT_EYE_TOP];
  const leftBottom = landmarks[LEFT_EYE_BOTTOM];
  const leftLeft = landmarks[LEFT_EYE_LEFT];
  const leftRight = landmarks[LEFT_EYE_RIGHT];

  const rightTop = landmarks[RIGHT_EYE_TOP];
  const rightBottom = landmarks[RIGHT_EYE_BOTTOM];
  const rightLeft = landmarks[RIGHT_EYE_LEFT];
  const rightRight = landmarks[RIGHT_EYE_RIGHT];

  const leftVertical = Math.sqrt(
    Math.pow((leftTop.x - leftBottom.x) * frameWidth, 2) +
      Math.pow((leftTop.y - leftBottom.y) * frameHeight, 2)
  );
  const leftHorizontal = Math.sqrt(
    Math.pow((leftLeft.x - leftRight.x) * frameWidth, 2) +
      Math.pow((leftLeft.y - leftRight.y) * frameHeight, 2)
  );
  const leftEar = leftHorizontal > 0 ? leftVertical / leftHorizontal : 0;

  const rightVertical = Math.sqrt(
    Math.pow((rightTop.x - rightBottom.x) * frameWidth, 2) +
      Math.pow((rightTop.y - rightBottom.y) * frameHeight, 2)
  );
  const rightHorizontal = Math.sqrt(
    Math.pow((rightLeft.x - rightRight.x) * frameWidth, 2) +
      Math.pow((rightLeft.y - rightRight.y) * frameHeight, 2)
  );
  const rightEar = rightHorizontal > 0 ? rightVertical / rightHorizontal : 0;

  const avgEar = (leftEar + rightEar) / 2;

  return { leftEar, rightEar, avgEar };
}