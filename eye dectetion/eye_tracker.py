import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image as MpImage
import numpy as np
from typing import Tuple, Optional, List, Any
import os
import urllib.request


class EyeTracker:
    LEFT_EYE_LANDMARKS = [
        362,
        382,
        381,
        380,
        374,
        373,
        390,
        249,
        263,
        466,
        388,
        387,
        386,
        385,
        384,
        398,
    ]
    RIGHT_EYE_LANDMARKS = [
        33,
        7,
        163,
        144,
        145,
        153,
        154,
        155,
        133,
        173,
        157,
        158,
        159,
        160,
        161,
        246,
    ]

    LEFT_IRIS_LANDMARK = 468
    RIGHT_IRIS_LANDMARK = 473

    LEFT_EYE_CORNERS = {"left": 33, "right": 133}
    RIGHT_EYE_CORNERS = {"left": 362, "right": 263}

    MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

    def __init__(
        self,
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ):
        self._download_model()

        base_options = python.BaseOptions(model_asset_path="face_landmarker.task")

        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_faces=max_num_faces,
            min_face_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

        self.face_landmarker = vision.FaceLandmarker.create_from_options(options)
        self.timestamp = 0

    def _download_model(self):
        model_path = "face_landmarker.task"
        if not os.path.exists(model_path):
            print("Downloading face landmarker model...")
            urllib.request.urlretrieve(self.MODEL_URL, model_path)
            print("Model downloaded.")

    def find_face_mesh(self, frame: np.ndarray) -> Optional[Any]:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = MpImage(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        self.timestamp += 33
        results = self.face_landmarker.detect_for_video(mp_image, self.timestamp)
        return results

    def get_eye_landmarks(self, face_landmarks, frame_shape: Tuple[int, int]) -> dict:
        h, w = frame_shape[:2]

        left_eye_points = []
        for idx in self.LEFT_EYE_LANDMARKS:
            point = face_landmarks[idx]
            left_eye_points.append((int(point.x * w), int(point.y * h)))

        right_eye_points = []
        for idx in self.RIGHT_EYE_LANDMARKS:
            point = face_landmarks[idx]
            right_eye_points.append((int(point.x * w), int(point.y * h)))

        left_iris = face_landmarks[self.LEFT_IRIS_LANDMARK]
        right_iris = face_landmarks[self.RIGHT_IRIS_LANDMARK]

        return {
            "left_eye": np.array(left_eye_points),
            "right_eye": np.array(right_eye_points),
            "left_iris": (int(left_iris.x * w), int(left_iris.y * h)),
            "right_iris": (int(right_iris.x * w), int(right_iris.y * h)),
            "left_iris_normalized": (left_iris.x, left_iris.y),
            "right_iris_normalized": (right_iris.x, right_iris.y),
            "landmarks": face_landmarks,
        }

    def get_eye_bounding_box(self, eye_points: np.ndarray) -> dict:
        x_min = int(np.min(eye_points[:, 0]))
        x_max = int(np.max(eye_points[:, 0]))
        y_min = int(np.min(eye_points[:, 1]))
        y_max = int(np.max(eye_points[:, 1]))

        return {
            "x": x_min,
            "y": y_min,
            "width": x_max - x_min,
            "height": y_max - y_min,
            "center": ((x_min + x_max) // 2, (y_min + y_max) // 2),
        }

    def calculate_gaze_ratio(
        self, eye_points: np.ndarray, iris_point: Tuple[int, int]
    ) -> float:
        eye_center_x = (np.min(eye_points[:, 0]) + np.max(eye_points[:, 0])) // 2
        iris_x, iris_y = iris_point

        eye_width = np.max(eye_points[:, 0]) - np.min(eye_points[:, 0])

        if eye_width == 0:
            return 0.5

        pupil_location = (iris_x - np.min(eye_points[:, 0])) / eye_width

        return float(np.clip(pupil_location, 0.0, 1.0))

    def calculate_vertical_gaze_ratio(
        self, eye_points: np.ndarray, iris_point: Tuple[int, int]
    ) -> float:
        """Calculates the vertical position of the pupil (0.0=top, 1.0=bottom)."""
        iris_x, iris_y = iris_point
        eye_top = np.min(eye_points[:, 1])
        eye_bottom = np.max(eye_points[:, 1])
        eye_height = eye_bottom - eye_top

        if eye_height == 0:
            return 0.5

        pupil_v_location = (iris_y - eye_top) / eye_height
        return float(np.clip(pupil_v_location, 0.0, 1.0))

    def get_gaze_direction(
        self, left_gaze_ratio: float, right_gaze_ratio: float
    ) -> str:
        avg_gaze = (left_gaze_ratio + right_gaze_ratio) / 2

        if avg_gaze < 0.4:
            return "LEFT"
        elif avg_gaze > 0.6:
            return "RIGHT"
        else:
            return "CENTER"

    def draw_eye_info(self, frame: np.ndarray, eye_data: dict) -> np.ndarray:
        left_eye = eye_data["left_eye"]
        right_eye = eye_data["right_eye"]

        cv2.polylines(frame, [left_eye], True, (0, 255, 0), 1)
        cv2.polylines(frame, [right_eye], True, (0, 255, 0), 1)

        cv2.circle(frame, eye_data["left_iris"], 3, (0, 0, 255), -1)
        cv2.circle(frame, eye_data["right_iris"], 3, (0, 0, 255), -1)

        return frame

    def get_combined_gaze_position(self, eye_data: dict) -> Tuple[float, float]:
        left_iris = eye_data["left_iris_normalized"]
        right_iris = eye_data["right_iris_normalized"]

        gaze_x = (left_iris[0] + right_iris[0]) / 2
        gaze_y = (left_iris[1] + right_iris[1]) / 2

        return gaze_x, gaze_y

    def release(self):
        self.face_landmarker.close()
