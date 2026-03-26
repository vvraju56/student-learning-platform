import numpy as np
from typing import Tuple, Dict, Optional
import cv2


class HeadPoseEstimator:
    FACE_3D_MODEL_POINTS = np.array(
        [
            [0.0, 0.0, 0.0],
            [0.0, -330.0, -65.0],
            [-225.0, 170.0, -135.0],
            [225.0, 170.0, -135.0],
            [-150.0, -150.0, -125.0],
            [150.0, -150.0, -125.0],
        ],
        dtype=np.float64,
    )

    LANDMARK_INDICES = {
        "nose_tip": 1,
        "chin": 152,
        "left_eye_left_corner": 33,
        "right_eye_right_corner": 263,
        "left_mouth_corner": 61,
        "right_mouth_corner": 291,
    }

    def __init__(self, focal_length: float = 1000.0):
        self.focal_length = focal_length
        self.smoothing_window = 5

        self.head_pose_buffer = []
        self.rotation_buffer_x = []
        self.rotation_buffer_y = []
        self.rotation_buffer_z = []

    def estimate_head_pose(self, landmarks, frame_shape: Tuple[int, int]) -> dict:
        h, w = frame_shape[:2]

        image_points = np.array(
            [
                [
                    landmarks[self.LANDMARK_INDICES["nose_tip"]].x * w,
                    landmarks[self.LANDMARK_INDICES["nose_tip"]].y * h,
                ],
                [
                    landmarks[self.LANDMARK_INDICES["chin"]].x * w,
                    landmarks[self.LANDMARK_INDICES["chin"]].y * h,
                ],
                [
                    landmarks[self.LANDMARK_INDICES["left_eye_left_corner"]].x * w,
                    landmarks[self.LANDMARK_INDICES["left_eye_left_corner"]].y * h,
                ],
                [
                    landmarks[self.LANDMARK_INDICES["right_eye_right_corner"]].x * w,
                    landmarks[self.LANDMARK_INDICES["right_eye_right_corner"]].y * h,
                ],
                [
                    landmarks[self.LANDMARK_INDICES["left_mouth_corner"]].x * w,
                    landmarks[self.LANDMARK_INDICES["left_mouth_corner"]].y * h,
                ],
                [
                    landmarks[self.LANDMARK_INDICES["right_mouth_corner"]].x * w,
                    landmarks[self.LANDMARK_INDICES["right_mouth_corner"]].y * h,
                ],
            ],
            dtype=np.float64,
        )

        center = (w / 2, h / 2)
        camera_matrix = np.array(
            [
                [self.focal_length, 0, center[0]],
                [0, self.focal_length, center[1]],
                [0, 0, 1],
            ],
            dtype=np.float64,
        )

        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        success, rotation_vector, translation_vector = cv2.solvePnP(
            self.FACE_3D_MODEL_POINTS,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            return {
                "success": False,
                "rotation_vector": None,
                "translation_vector": None,
                "euler_angles": None,
                "head_direction": "UNKNOWN",
            }

        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        euler_angles = self._rotation_matrix_to_euler_angles(rotation_matrix)

        roll, pitch, yaw = euler_angles

        self.rotation_buffer_x.append(roll)
        self.rotation_buffer_y.append(pitch)
        self.rotation_buffer_z.append(yaw)

        if len(self.rotation_buffer_x) > self.smoothing_window:
            self.rotation_buffer_x.pop(0)
            self.rotation_buffer_y.pop(0)
            self.rotation_buffer_z.pop(0)

        smooth_roll = float(np.mean(self.rotation_buffer_x))
        smooth_pitch = float(np.mean(self.rotation_buffer_y))
        smooth_yaw = float(np.mean(self.rotation_buffer_z))

        head_direction = self._determine_head_direction(
            smooth_yaw, smooth_pitch, smooth_roll
        )

        nose_point_3d = np.array(
            [
                (landmarks[self.LANDMARK_INDICES["nose_tip"]].x * w - center[0])
                / self.focal_length,
                (landmarks[self.LANDMARK_INDICES["nose_tip"]].y * h - center[1])
                / self.focal_length,
                1.0,
            ],
            dtype=np.float64,
        )

        nose_point_2d, _ = cv2.projectPoints(
            np.array([nose_point_3d]),
            rotation_vector,
            translation_vector,
            camera_matrix,
            dist_coeffs,
        )

        nose_point_2d = tuple(nose_point_2d[0][0].astype(int))

        return {
            "success": True,
            "rotation_vector": rotation_vector,
            "translation_vector": translation_vector,
            "euler_angles": {
                "roll": smooth_roll,
                "pitch": smooth_pitch,
                "yaw": smooth_yaw,
            },
            "head_direction": head_direction,
            "nose_point_2d": nose_point_2d,
            "raw_euler": {"roll": roll, "pitch": pitch, "yaw": yaw},
        }

    def _rotation_matrix_to_euler_angles(
        self, rotation_matrix: np.ndarray
    ) -> np.ndarray:
        sy = np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)

        singular = sy < 1e-6

        if not singular:
            x = np.arctan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
            y = np.arctan2(-rotation_matrix[2, 0], sy)
            z = np.arctan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
        else:
            x = np.arctan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
            y = np.arctan2(-rotation_matrix[2, 0], sy)
            z = 0

        return np.array([np.degrees(x), np.degrees(y), np.degrees(z)])

    def _determine_head_direction(self, yaw: float, pitch: float, roll: float) -> str:
        direction = "CENTER"

        if abs(yaw) > 15:
            if yaw > 0:
                direction = "RIGHT"
            else:
                direction = "LEFT"

        if abs(pitch) > 15:
            if pitch > 0:
                if direction == "CENTER":
                    direction = "DOWN"
                else:
                    direction += "-DOWN"
            else:
                if direction == "CENTER":
                    direction = "UP"
                else:
                    direction += "-UP"

        if direction == "CENTER" and abs(roll) > 10:
            direction = "TILTED"

        return direction

    def draw_head_pose(self, frame: np.ndarray, pose_data: dict) -> np.ndarray:
        if not pose_data.get("success", False):
            return frame

        euler = pose_data["euler_angles"]
        if euler is None:
            return frame

        roll = euler["roll"]
        pitch = euler["pitch"]
        yaw = euler["yaw"]

        direction = pose_data["head_direction"]

        color = (0, 255, 0) if direction == "CENTER" else (0, 165, 255)

        cv2.putText(
            frame,
            f"Head: {direction}",
            (20, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2,
        )

        cv2.putText(
            frame,
            f"Roll: {roll:.1f} deg",
            (20, 150),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (200, 200, 200),
            1,
        )
        cv2.putText(
            frame,
            f"Pitch: {pitch:.1f} deg",
            (20, 175),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (200, 200, 200),
            1,
        )
        cv2.putText(
            frame,
            f"Yaw: {yaw:.1f} deg",
            (20, 200),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (200, 200, 200),
            1,
        )

        return frame

    def reset(self):
        self.head_pose_buffer = []
        self.rotation_buffer_x = []
        self.rotation_buffer_y = []
        self.rotation_buffer_z = []
