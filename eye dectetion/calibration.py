import numpy as np
from typing import List, Tuple, Dict
import cv2


class CalibrationSystem:
    def __init__(self, screen_width: int, screen_height: int):
        self.screen_width = screen_width
        self.screen_height = screen_height

        self.calibration_points = [
            (0.5, 0.5),
            (0.1, 0.1),
            (0.5, 0.1),
            (0.9, 0.1),
            (0.1, 0.5),
            (0.9, 0.5),
            (0.1, 0.9),
            (0.5, 0.9),
            (0.9, 0.9),
        ]

        self.calibration_data: Dict[Tuple[float, float], List[Tuple[float, float]]] = {}
        self.is_calibrated = False
        self.current_point_index = 0
        self.samples_collected = 0
        self.samples_required = 30

        self.gaze_to_screen_mapping = {
            "min_x": 0.0,
            "max_x": 1.0,
            "min_y": 0.0,
            "max_y": 1.0,
        }

        self.calibration_valid = False

    def get_current_calibration_point(self) -> Tuple[int, int]:
        if self.current_point_index < len(self.calibration_points):
            norm_x, norm_y = self.calibration_points[self.current_point_index]
            return int(norm_x * self.screen_width), int(norm_y * self.screen_height)
        return self.screen_width // 2, self.screen_height // 2

    def add_calibration_sample(self, gaze_x: float, gaze_y: float) -> bool:
        if self.current_point_index >= len(self.calibration_points):
            return False

        current_point = self.calibration_points[self.current_point_index]

        if current_point not in self.calibration_data:
            self.calibration_data[current_point] = []

        self.calibration_data[current_point].append((gaze_x, gaze_y))
        self.samples_collected += 1

        if len(self.calibration_data[current_point]) >= self.samples_required:
            self.current_point_index += 1
            self.samples_collected = 0

        if self.current_point_index >= len(self.calibration_points):
            self._compute_mapping()
            self.calibration_valid = True

        return self.calibration_valid

    def _compute_mapping(self):
        if not self.calibration_data:
            return

        all_gaze_x = []
        all_gaze_y = []
        all_screen_x = []
        all_screen_y = []

        for screen_point, gaze_points in self.calibration_data.items():
            if gaze_points:
                avg_gaze_x = np.mean([p[0] for p in gaze_points])
                avg_gaze_y = np.mean([p[1] for p in gaze_points])

                all_gaze_x.append(avg_gaze_x)
                all_gaze_y.append(avg_gaze_y)
                all_screen_x.append(screen_point[0])
                all_screen_y.append(screen_point[1])

        if all_gaze_x and all_gaze_y:
            self.gaze_to_screen_mapping = {
                "min_x": min(all_gaze_x),
                "max_x": max(all_gaze_x),
                "min_y": min(all_gaze_y),
                "max_y": max(all_gaze_y),
            }
            self.is_calibrated = True

    def map_gaze_to_screen(self, gaze_x: float, gaze_y: float) -> Tuple[int, int]:
        if not self.is_calibrated:
            screen_x = int(gaze_x * self.screen_width)
            screen_y = int(gaze_y * self.screen_height)
        else:
            mapping = self.gaze_to_screen_mapping

            range_x = mapping["max_x"] - mapping["min_x"]
            range_y = mapping["max_y"] - mapping["min_y"]

            if range_x > 0:
                normalized_x = (gaze_x - mapping["min_x"]) / range_x
            else:
                normalized_x = 0.5

            if range_y > 0:
                normalized_y = (gaze_y - mapping["min_y"]) / range_y
            else:
                normalized_y = 0.5

            normalized_x = np.clip(normalized_x, 0.0, 1.0)
            normalized_y = np.clip(normalized_y, 0.0, 1.0)

            screen_x = int(normalized_x * self.screen_width)
            screen_y = int(normalized_y * self.screen_height)

        return screen_x, screen_y

    def is_gaze_on_screen(self, gaze_x: float, gaze_y: float, margin: float = 0.15) -> bool:
        """Checks if the gaze is within the calibrated screen area plus a margin."""
        if not self.is_calibrated:
            return True  # Assume on screen if not calibrated yet
        
        mapping = self.gaze_to_screen_mapping
        rx = mapping["max_x"] - mapping["min_x"]
        ry = mapping["max_y"] - mapping["min_y"]
        
        return (mapping["min_x"] - rx * margin <= gaze_x <= mapping["max_x"] + rx * margin and
                mapping["min_y"] - ry * margin <= gaze_y <= mapping["max_y"] + ry * margin)

    def reset_calibration(self):
        self.calibration_data = {}
        self.current_point_index = 0
        self.samples_collected = 0
        self.is_calibrated = False
        self.calibration_valid = False
        self.gaze_to_screen_mapping = {
            "min_x": 0.0,
            "max_x": 1.0,
            "min_y": 0.0,
            "max_y": 1.0,
        }

    def get_calibration_progress(self) -> float:
        total_points = len(self.calibration_points)
        if total_points == 0:
            return 0.0
        return self.current_point_index / total_points

    def draw_calibration_ui(self, frame, point_label: str = "") -> np.ndarray:
        h, w = frame.shape[:2]
        current_x, current_y = self.get_current_calibration_point()

        progress = self.get_calibration_progress()

        cv2.circle(frame, (current_x, current_y), 30, (0, 255, 0), 2)
        cv2.circle(frame, (current_x, current_y), 5, (0, 255, 0), -1)

        progress_bar_width = 200
        progress_bar_height = 20
        progress_bar_x = (w - progress_bar_width) // 2
        progress_bar_y = h - 50

        cv2.rectangle(
            frame,
            (progress_bar_x, progress_bar_y),
            (progress_bar_x + progress_bar_width, progress_bar_y + progress_bar_height),
            (100, 100, 100),
            -1,
        )
        cv2.rectangle(
            frame,
            (progress_bar_x, progress_bar_y),
            (
                progress_bar_x + int(progress_bar_width * progress),
                progress_bar_y + progress_bar_height,
            ),
            (0, 255, 0),
            -1,
        )

        cv2.putText(
            frame,
            f"Calibration: {int(progress * 100)}%",
            (progress_bar_x, progress_bar_y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )

        if point_label:
            cv2.putText(
                frame,
                point_label,
                (current_x - 50, current_y - 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )

        return frame

    def get_calibration_point_label(self) -> str:
        labels = [
            "Center",
            "Top Left",
            "Top Center",
            "Top Right",
            "Middle Left",
            "Middle Right",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ]
        if self.current_point_index < len(labels):
            return labels[self.current_point_index]
        return ""
