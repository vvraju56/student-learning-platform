import cv2
import numpy as np
import time
import threading
from collections import deque
from typing import Optional
import sys

from eye_tracker import EyeTracker
from blink_detector import BlinkDetector
from head_pose import HeadPoseEstimator
from calibration import CalibrationSystem
from mouse_controller import MouseController


class AdvancedEyeTrackerApp:
    def __init__(self):
        self.screen_width, self.screen_height = self._get_screen_size()

        self.eye_tracker = EyeTracker()
        self.blink_detector = BlinkDetector()
        self.head_pose_estimator = HeadPoseEstimator()
        self.calibration = CalibrationSystem(self.screen_width, self.screen_height)
        self.mouse_controller = MouseController(self.screen_width, self.screen_height)

        self.cap: Optional[cv2.VideoCapture] = None
        self.running = True  # Default start
        self.calibrating = False
        self.mouse_control_enabled = False
        self.show_landmarks = True  # Enable by default to confirm detection
        self.show_info = False       

        self.fps = 0
        self.frame_count = 0
        self.fps_start_time = time.time()

        # Distraction monitoring
        self.distracted = False
        self.distraction_timer = 0
        self.distraction_threshold = 1.5  # Faster response
        self.distraction_reason = ""

        self.gaze_history = deque(maxlen=60)

        self.colors = {
            "primary": (0, 255, 0),
            "alert": (0, 0, 255),
            "text": (255, 255, 255),
        }

    def _get_screen_size(self) -> tuple:
        try:
            import pyautogui
            return pyautogui.size()
        except:
            return 1920, 1080

    def initialize_camera(self, camera_index: int = 0) -> bool:
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            print(f"Error: Could not open camera {camera_index}")
            return False
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        return True

    def start(self, camera_index: int = 0):
        if not self.initialize_camera(camera_index):
            return

        print("Eye Tracking Active. Press ESC to quit.")
        self._run_main_loop()

    def _run_main_loop(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret: break
            
            frame = cv2.flip(frame, 1)
            frame = self._process_frame(frame)

            cv2.imshow("Eye Tracking - Distraction Monitor", frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 27: break  # ESC to quit
            self._handle_keypress(key)

            self.frame_count += 1
            if time.time() - self.fps_start_time >= 1.0:
                self.fps = self.frame_count / (time.time() - self.fps_start_time)
                self.frame_count = 0
                self.fps_start_time = time.time()

        self._cleanup()

    def _process_frame(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        results = self.eye_tracker.find_face_mesh(frame)

        is_focused = False
        reason = "NO FACE"

        if results and results.face_landmarks and len(results.face_landmarks) > 0:
            face_landmarks = results.face_landmarks[0]
            eye_data = self.eye_tracker.get_eye_landmarks(face_landmarks, (h, w))
            head_data = self.head_pose_estimator.estimate_head_pose(face_landmarks, (h, w))
            blink_data = self.blink_detector.update(face_landmarks, (h, w))
            gx, gy = self.eye_tracker.get_combined_gaze_position(eye_data)
            
            # Gaze check (Screen mapping if calibrated, otherwise Iris position)
            if self.calibration.is_calibrated:
                on_screen = self.calibration.is_gaze_on_screen(gx, gy)
            else:
                # Fallback: Check if iris is at extreme positions
                # Horizontal Ratio (0.0=Left, 1.0=Right)
                l_h_ratio = self.eye_tracker.calculate_gaze_ratio(eye_data["left_eye"], eye_data["left_iris"])
                r_h_ratio = self.eye_tracker.calculate_gaze_ratio(eye_data["right_eye"], eye_data["right_iris"])
                avg_h_ratio = (l_h_ratio + r_h_ratio) / 2
                
                # Vertical Ratio (0.0=Top, 1.0=Bottom)
                l_v_ratio = self.eye_tracker.calculate_vertical_gaze_ratio(eye_data["left_eye"], eye_data["left_iris"])
                r_v_ratio = self.eye_tracker.calculate_vertical_gaze_ratio(eye_data["right_eye"], eye_data["right_iris"])
                avg_v_ratio = (l_v_ratio + r_v_ratio) / 2
                
                # Tighten thresholds: Horizontal (0.25-0.75), Vertical (0.35-0.75)
                h_on_screen = 0.25 < avg_h_ratio < 0.75
                v_on_screen = 0.35 < avg_v_ratio < 0.75
                
                on_screen = h_on_screen and v_on_screen
                
                # Show hint that calibration improves this
                cv2.putText(frame, "Press 'C' to Calibrate Screen for Better Accuracy", (w-450, 40), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
            
            # Thresholds: Yaw/Pitch < 20 degrees is okay
            euler = head_data.get("euler_angles")
            if euler:
                centered = abs(euler["yaw"]) < 20 and abs(euler["pitch"]) < 20
            else:
                centered = False
            
            eyes_open = not blink_data.get("eyes_closed", False)
            
            is_focused = on_screen and centered and eyes_open
            
            if not on_screen: reason = "LOOKING AWAY"
            elif not centered: reason = "HEAD TURNED"
            elif not eyes_open: reason = "EYES CLOSED"

            # Draw landmarks to confirm detection
            if self.show_landmarks:
                frame = self.eye_tracker.draw_eye_info(frame, eye_data)
                # Show iris ratio for debugging when not calibrated
                if not self.calibration.is_calibrated:
                    cv2.putText(frame, f"H: {avg_h_ratio:.2f} V: {avg_v_ratio:.2f}", (20, 80), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.colors["primary"], 1)

        # Timer logic
        if not is_focused:
            if self.distraction_timer == 0:
                self.distraction_timer = time.time()
            
            if time.time() - self.distraction_timer > self.distraction_threshold:
                self.distracted = True
                self.distraction_reason = reason
        else:
            self.distracted = False
            self.distraction_timer = 0

        # UI Overlay (Minimal)
        if self.distracted:
            cv2.rectangle(frame, (0, 0), (w, h), self.colors["alert"], 10)
            cv2.putText(frame, "DISTRACTED!", (w//2-200, h//2), 
                        cv2.FONT_HERSHEY_SIMPLEX, 2, self.colors["alert"], 4)
            cv2.putText(frame, f"Reason: {self.distraction_reason}", (w//2-150, h//2+60), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, self.colors["alert"], 2)
        else:
            cv2.putText(frame, "FOCUSED", (20, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, self.colors["primary"], 2)

        return frame

    def _handle_keypress(self, key: int):
        if key == ord('c'): self.calibration.reset_calibration()
        if key == ord('l'): self.show_landmarks = not self.show_landmarks

    def _cleanup(self):
        if self.cap: self.cap.release()
        cv2.destroyAllWindows()
        self.eye_tracker.release()

if __name__ == "__main__":
    app = AdvancedEyeTrackerApp()
    app.start()
