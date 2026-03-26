import numpy as np
from collections import deque
from typing import Tuple, Optional
import time


class BlinkDetector:
    LEFT_EYE_TOP = 159
    LEFT_EYE_BOTTOM = 145
    RIGHT_EYE_TOP = 386
    RIGHT_EYE_BOTTOM = 374
    LEFT_EYE_LEFT = 33
    LEFT_EYE_RIGHT = 133
    RIGHT_EYE_LEFT = 362
    RIGHT_EYE_RIGHT = 263

    def __init__(self, ear_threshold: float = 0.2, consecutive_frames: int = 3):
        self.ear_threshold = ear_threshold
        self.consecutive_frames = consecutive_frames
        self.blink_counter = 0
        self.frame_counter = 0

        self.ear_history = deque(maxlen=30)
        self.blink_events = deque(maxlen=100)

        self.last_blink_time = 0
        self.blink_cooldown = 0.3

        self.left_blink = False
        self.right_blink = False
        self.both_blink = False

        self.auto_calibrated = False
        self.open_eye_ear = 0.3
        self.auto_calibrated_threshold = ear_threshold

    def calculate_ear(self, eye_landmarks: np.ndarray) -> float:
        vertical_dist = float(np.linalg.norm(eye_landmarks[1] - eye_landmarks[5]))
        horizontal_dist = float(np.linalg.norm(eye_landmarks[0] - eye_landmarks[3]))

        if horizontal_dist == 0:
            return 0.0

        ear = vertical_dist / horizontal_dist
        return float(ear)

    def calculate_eye_aspect_ratio(
        self, landmarks, frame_shape: Tuple[int, int]
    ) -> dict:
        h, w = frame_shape[:2]

        left_top = np.array(
            [landmarks[self.LEFT_EYE_TOP].x * w, landmarks[self.LEFT_EYE_TOP].y * h]
        )
        left_bottom = np.array(
            [
                landmarks[self.LEFT_EYE_BOTTOM].x * w,
                landmarks[self.LEFT_EYE_BOTTOM].y * h,
            ]
        )
        left_left = np.array(
            [landmarks[self.LEFT_EYE_LEFT].x * w, landmarks[self.LEFT_EYE_LEFT].y * h]
        )
        left_right = np.array(
            [landmarks[self.LEFT_EYE_RIGHT].x * w, landmarks[self.LEFT_EYE_RIGHT].y * h]
        )

        right_top = np.array(
            [landmarks[self.RIGHT_EYE_TOP].x * w, landmarks[self.RIGHT_EYE_TOP].y * h]
        )
        right_bottom = np.array(
            [
                landmarks[self.RIGHT_EYE_BOTTOM].x * w,
                landmarks[self.RIGHT_EYE_BOTTOM].y * h,
            ]
        )
        right_left = np.array(
            [landmarks[self.RIGHT_EYE_LEFT].x * w, landmarks[self.RIGHT_EYE_LEFT].y * h]
        )
        right_right = np.array(
            [
                landmarks[self.RIGHT_EYE_RIGHT].x * w,
                landmarks[self.RIGHT_EYE_RIGHT].y * h,
            ]
        )

        left_vertical = float(np.linalg.norm(left_top - left_bottom))
        left_horizontal = float(np.linalg.norm(left_left - left_right))
        left_ear = left_vertical / left_horizontal if left_horizontal > 0 else 0

        right_vertical = float(np.linalg.norm(right_top - right_bottom))
        right_horizontal = float(np.linalg.norm(right_left - right_right))
        right_ear = right_vertical / right_horizontal if right_horizontal > 0 else 0

        avg_ear = (left_ear + right_ear) / 2

        return {
            "left_ear": left_ear,
            "right_ear": right_ear,
            "avg_ear": avg_ear,
            "left_top": left_top,
            "left_bottom": left_bottom,
            "right_top": right_top,
            "right_bottom": right_bottom,
        }

    def update(self, landmarks, frame_shape: Tuple[int, int]) -> dict:
        ear_data = self.calculate_eye_aspect_ratio(landmarks, frame_shape)
        avg_ear = ear_data["avg_ear"]
        left_ear = ear_data["left_ear"]
        right_ear = ear_data["right_ear"]

        self.ear_history.append(avg_ear)

        left_threshold = (
            self.auto_calibrated_threshold
            if self.auto_calibrated
            else self.ear_threshold
        )
        right_threshold = left_threshold
        avg_threshold = left_threshold

        left_closed = left_ear < left_threshold
        right_closed = right_ear < right_threshold

        if left_closed and not right_closed:
            self.left_blink = True
            self.right_blink = False
            self.both_blink = False
        elif right_closed and not left_closed:
            self.right_blink = True
            self.left_blink = False
            self.both_blink = False
        elif left_closed and right_closed:
            self.left_blink = False
            self.right_blink = False
            self.both_blink = True
        else:
            self.left_blink = False
            self.right_blink = False
            self.both_blink = False

        blink_detected = False
        current_time = time.time()

        if avg_ear < avg_threshold:
            self.frame_counter += 1
        else:
            if self.frame_counter >= self.consecutive_frames:
                if current_time - self.last_blink_time > self.blink_cooldown:
                    self.blink_counter += 1
                    blink_detected = True
                    self.last_blink_time = current_time
                    self.blink_events.append(
                        {
                            "time": current_time,
                            "duration": self.frame_counter,
                            "ear": avg_ear,
                        }
                    )
            self.frame_counter = 0

        return {
            "left_ear": left_ear,
            "right_ear": right_ear,
            "avg_ear": avg_ear,
            "blink_detected": blink_detected,
            "blink_count": self.blink_counter,
            "left_blink": self.left_blink,
            "right_blink": self.right_blink,
            "both_blink": self.both_blink,
            "eyes_closed": avg_ear < avg_threshold,
            "left_eye_points": ear_data,
        }

    def auto_calibrate(
        self, landmarks, frame_shape: Tuple[int, int], duration: float = 2.0
    ):
        ear_data = self.calculate_eye_aspect_ratio(landmarks, frame_shape)
        self.ear_history.append(ear_data["avg_ear"])

        if len(self.ear_history) >= 30:
            recent_ears = list(self.ear_history)[-30:]
            self.open_eye_ear = float(np.mean(recent_ears))
            self.auto_calibrated_threshold = self.open_eye_ear * 0.65
            self.auto_calibrated = True

    def get_blink_rate(self, window_seconds: float = 60.0) -> float:
        current_time = time.time()
        recent_blinks = [
            b for b in self.blink_events if current_time - b["time"] <= window_seconds
        ]

        if window_seconds <= 0:
            return 0.0

        return len(recent_blinks) / (window_seconds / 60.0)

    def reset(self):
        self.blink_counter = 0
        self.frame_counter = 0
        self.ear_history.clear()
        self.blink_events.clear()
        self.last_blink_time = 0
        self.left_blink = False
        self.right_blink = False
        self.both_blink = False
