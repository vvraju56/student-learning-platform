export const LANDMARK_INDICES = {
  noseTip: 1,
  chin: 152,
  leftEyeLeftCorner: 33,
  rightEyeRightCorner: 263,
  leftMouthCorner: 61,
  rightMouthCorner: 291,
};

export interface HeadPoseData {
  success: boolean;
  eulerAngles: { roll: number; pitch: number; yaw: number } | null;
  headDirection: string;
}

function determineHeadDirection(
  yaw: number,
  pitch: number,
  roll: number
): string {
  let direction = "CENTER";

  if (Math.abs(yaw) > 15) {
    direction = yaw > 0 ? "RIGHT" : "LEFT";
  }

  if (Math.abs(pitch) > 15) {
    direction = pitch > 0 ? "DOWN" : "UP";
  }

  if (direction === "CENTER" && Math.abs(roll) > 10) {
    direction = "TILTED";
  }

  return direction;
}

export function estimateHeadPose(
  landmarks: { x: number; y: number; z: number }[],
  _frameWidth: number,
  _frameHeight: number
): HeadPoseData {
  const noseTip = landmarks[LANDMARK_INDICES.noseTip];
  const leftCorner = landmarks[LANDMARK_INDICES.leftEyeLeftCorner];
  const rightCorner = landmarks[LANDMARK_INDICES.rightEyeRightCorner];
  const chin = landmarks[LANDMARK_INDICES.chin];

  const faceCenterX = (leftCorner.x + rightCorner.x) / 2;
  const faceCenterY = (noseTip.y + chin.y) / 2;

  let yaw = ((faceCenterX - 0.5) * 2) * 30;
  let pitch = ((faceCenterY - 0.5) * 2) * 30;

  const rollAngle = Math.atan2(
    rightCorner.y - leftCorner.y,
    rightCorner.x - leftCorner.x
  );
  const roll = rollAngle * (180 / Math.PI);

  const eulerAngles = { roll, pitch, yaw };
  const headDirection = determineHeadDirection(yaw, pitch, roll);

  return {
    success: true,
    eulerAngles,
    headDirection,
  };
}