import customtkinter as ctk
import cv2
import numpy as np
from PIL import Image, ImageTk
import threading
import time
from collections import deque

from eye_tracker import EyeTracker
from blink_detector import BlinkDetector
from head_pose import HeadPoseEstimator
from calibration import CalibrationSystem
from mouse_controller import MouseController


class EyeTrackingGUI:
    def __init__(self):
        self.screen_width, self.screen_height = self._get_screen_size()

        self.eye_tracker = EyeTracker()
        self.blink_detector = BlinkDetector()
        self.head_pose_estimator = HeadPoseEstimator()
        self.calibration = CalibrationSystem(self.screen_width, self.screen_height)
        self.mouse_controller = MouseController(self.screen_width, self.screen_height)

        self.cap = None
        self.running = False
        self.calibrating = False
        self.mouse_control_enabled = False
        self.show_landmarks = True

        self.fps = 0
        self.frame_count = 0
        self.fps_start_time = time.time()

        self.gaze_history = deque(maxlen=60)

        self._setup_gui()

    def _get_screen_size(self) -> tuple:
        try:
            import pyautogui

            return pyautogui.size()
        except:
            return 1920, 1080

    def _setup_gui(self):
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.root = ctk.CTk()
        self.root.title("Advanced Eye Tracking System")
        self.root.geometry("1400x900")
        self.root.protocol("WM_DELETE_WINDOW", self._on_closing)

        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(0, weight=1)

        self._create_sidebar()
        self._create_main_content()
        self._create_status_bar()

    def _create_sidebar(self):
        self.sidebar = ctk.CTkFrame(self.root, width=300, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")

        self.sidebar.grid_rowconfigure(12, weight=1)

        title = ctk.CTkLabel(
            self.sidebar, text="Eye Tracking", font=ctk.CTkFont(size=24, weight="bold")
        )
        title.grid(row=0, column=0, padx=20, pady=(20, 10))

        subtitle = ctk.CTkLabel(
            self.sidebar, text="Controls & Settings", font=ctk.CTkFont(size=14)
        )
        subtitle.grid(row=1, column=0, padx=20, pady=(0, 20))

        self.camera_label = ctk.CTkLabel(self.sidebar, text="Camera Index:")
        self.camera_label.grid(row=2, column=0, padx=20, pady=(10, 0), sticky="w")

        self.camera_var = ctk.StringVar(value="0")
        self.camera_entry = ctk.CTkEntry(
            self.sidebar, textvariable=self.camera_var, width=200
        )
        self.camera_entry.grid(row=3, column=0, padx=20, pady=(0, 10))

        self.start_button = ctk.CTkButton(
            self.sidebar,
            text="Start Tracking",
            command=self._toggle_tracking,
            fg_color="#2ecc71",
            hover_color="#27ae60",
        )
        self.start_button.grid(row=4, column=0, padx=20, pady=10)

        self.calibrate_button = ctk.CTkButton(
            self.sidebar,
            text="Calibrate",
            command=self._toggle_calibration,
            fg_color="#3498db",
            hover_color="#2980b9",
        )
        self.calibrate_button.grid(row=5, column=0, padx=20, pady=10)

        self.mouse_button = ctk.CTkButton(
            self.sidebar,
            text="Enable Mouse Control",
            command=self._toggle_mouse_control,
            fg_color="#9b59b6",
            hover_color="#8e44ad",
        )
        self.mouse_button.grid(row=6, column=0, padx=20, pady=10)

        self.landmarks_var = ctk.BooleanVar(value=True)
        self.landmarks_switch = ctk.CTkSwitch(
            self.sidebar,
            text="Show Landmarks",
            variable=self.landmarks_var,
            command=self._toggle_landmarks,
        )
        self.landmarks_switch.grid(row=7, column=0, padx=20, pady=10, sticky="w")

        sensitivity_label = ctk.CTkLabel(self.sidebar, text="Mouse Sensitivity:")
        sensitivity_label.grid(row=8, column=0, padx=20, pady=(20, 0), sticky="w")

        self.sensitivity_slider = ctk.CTkSlider(
            self.sidebar, from_=0.1, to=3.0, command=self._update_sensitivity, width=200
        )
        self.sensitivity_slider.set(1.0)
        self.sensitivity_slider.grid(row=9, column=0, padx=20, pady=(0, 10))

        smoothing_label = ctk.CTkLabel(self.sidebar, text="Smoothing:")
        smoothing_label.grid(row=10, column=0, padx=20, pady=(10, 0), sticky="w")

        self.smoothing_slider = ctk.CTkSlider(
            self.sidebar, from_=1, to=20, command=self._update_smoothing, width=200
        )
        self.smoothing_slider.set(5)
        self.smoothing_slider.grid(row=11, column=0, padx=20, pady=(0, 10))

        reset_button = ctk.CTkButton(
            self.sidebar,
            text="Reset All",
            command=self._reset_all,
            fg_color="#e74c3c",
            hover_color="#c0392b",
        )
        reset_button.grid(row=13, column=0, padx=20, pady=10)

    def _create_main_content(self):
        self.main_content = ctk.CTkFrame(self.root)
        self.main_content.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)

        self.main_content.grid_columnconfigure(0, weight=1)
        self.main_content.grid_rowconfigure(0, weight=1)

        self.video_frame = ctk.CTkFrame(self.main_content)
        self.video_frame.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)

        self.canvas = ctk.CTkCanvas(
            self.video_frame, bg="#2b2b2b", highlightthickness=0
        )
        self.canvas.pack(fill="both", expand=True, padx=5, pady=5)

        self.info_frame = ctk.CTkFrame(self.main_content, height=200)
        self.info_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=10)

        self.info_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)

        self.fps_label = ctk.CTkLabel(
            self.info_frame, text="FPS: --", font=ctk.CTkFont(size=14)
        )
        self.fps_label.grid(row=0, column=0, padx=10, pady=5)

        self.ear_label = ctk.CTkLabel(
            self.info_frame, text="EAR: --", font=ctk.CTkFont(size=14)
        )
        self.ear_label.grid(row=0, column=1, padx=10, pady=5)

        self.blink_label = ctk.CTkLabel(
            self.info_frame, text="Blinks: 0", font=ctk.CTkFont(size=14)
        )
        self.blink_label.grid(row=0, column=2, padx=10, pady=5)

        self.direction_label = ctk.CTkLabel(
            self.info_frame, text="Head: --", font=ctk.CTkFont(size=14)
        )
        self.direction_label.grid(row=0, column=3, padx=10, pady=5)

        self.gaze_label = ctk.CTkLabel(
            self.info_frame, text="Gaze: --", font=ctk.CTkFont(size=12)
        )
        self.gaze_label.grid(row=1, column=0, columnspan=2, padx=10, pady=5)

        self.status_label = ctk.CTkLabel(
            self.info_frame, text="Status: Idle", font=ctk.CTkFont(size=12)
        )
        self.status_label.grid(row=1, column=2, columnspan=2, padx=10, pady=5)

    def _create_status_bar(self):
        self.status_bar = ctk.CTkFrame(self.root, height=30, corner_radius=0)
        self.status_bar.grid(row=1, column=0, columnspan=2, sticky="ew")

        self.status_text = ctk.CTkLabel(
            self.status_bar, text="Ready", font=ctk.CTkFont(size=12)
        )
        self.status_text.pack(side="left", padx=10, pady=5)

        self.camera_status = ctk.CTkLabel(
            self.status_bar, text="Camera: Off", font=ctk.CTkFont(size=12)
        )
        self.camera_status.pack(side="right", padx=10, pady=5)

    def _toggle_tracking(self):
        if not self.running:
            self._start_tracking()
        else:
            self._stop_tracking()

    def _start_tracking(self):
        try:
            camera_index = int(self.camera_var.get())
        except ValueError:
            self._update_status("Invalid camera index")
            return

        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            self._update_status(f"Could not open camera {camera_index}")
            return

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        self.running = True
        self.start_button.configure(
            text="Stop Tracking", fg_color="#e74c3c", hover_color="#c0392b"
        )
        self.camera_status.configure(text=f"Camera: {camera_index}")
        self._update_status("Tracking started")

        self._update_frame()

    def _stop_tracking(self):
        self.running = False
        if self.cap:
            self.cap.release()
            self.cap = None

        self.start_button.configure(
            text="Start Tracking", fg_color="#2ecc71", hover_color="#27ae60"
        )
        self.camera_status.configure(text="Camera: Off")
        self._update_status("Tracking stopped")

    def _toggle_calibration(self):
        self.calibrating = not self.calibrating
        if self.calibrating:
            self.calibration.reset_calibration()
            self.calibrate_button.configure(
                text="Stop Calibration", fg_color="#e74c3c", hover_color="#c0392b"
            )
            self._update_status("Calibrating... Look at the green dots")
        else:
            self.calibrate_button.configure(
                text="Calibrate", fg_color="#3498db", hover_color="#2980b9"
            )
            self._update_status("Calibration stopped")

    def _toggle_mouse_control(self):
        self.mouse_control_enabled = not self.mouse_control_enabled
        if self.mouse_control_enabled:
            self.mouse_controller.enable()
            self.mouse_button.configure(
                text="Disable Mouse Control", fg_color="#e74c3c", hover_color="#c0392b"
            )
            self._update_status("Mouse control enabled")
        else:
            self.mouse_controller.disable()
            self.mouse_button.configure(
                text="Enable Mouse Control", fg_color="#9b59b6", hover_color="#8e44ad"
            )
            self._update_status("Mouse control disabled")

    def _toggle_landmarks(self):
        self.show_landmarks = self.landmarks_var.get()

    def _update_sensitivity(self, value):
        self.mouse_controller.set_sensitivity(value, value)

    def _update_smoothing(self, value):
        self.mouse_controller.set_smoothing(int(value))

    def _reset_all(self):
        self.calibration.reset_calibration()
        self.blink_detector.reset()
        self.head_pose_estimator.reset()
        self.mouse_controller.reset()
        self.gaze_history.clear()
        self._update_status("All systems reset")

    def _update_status(self, message: str):
        self.status_text.configure(text=message)

    def _update_frame(self):
        if not self.running or not self.cap:
            return

        ret, frame = self.cap.read()
        if ret:
            frame = cv2.flip(frame, 1)
            processed_frame = self._process_frame(frame)

            self._display_frame(processed_frame)

            self.root.after(10, self._update_frame)
        else:
            self._stop_tracking()

    def _process_frame(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]

        results = self.eye_tracker.find_face_mesh(frame)

        if results and results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]
            landmarks = face_landmarks.landmark

            eye_data = self.eye_tracker.get_eye_landmarks(landmarks, (h, w))
            blink_data = self.blink_detector.update(landmarks, (h, w))
            head_pose_data = self.head_pose_estimator.estimate_head_pose(
                landmarks, (h, w)
            )

            gaze_x, gaze_y = self.eye_tracker.get_combined_gaze_position(eye_data)
            self.gaze_history.append((gaze_x, gaze_y))

            if self.calibrating and not self.calibration.calibration_valid:
                frame = self.calibration.draw_calibration_ui(
                    frame, self.calibration.get_calibration_point_label()
                    )
                self.calibration.add_calibration_sample(gaze_x, gaze_y)
                if self.calibration.calibration_valid:
                    self.calibrating = False
                    self.calibrate_button.configure(
                        text="Calibrate", fg_color="#3498db", hover_color="#2980b9"
                    )
                    self._update_status("Calibration complete!")

            if self.show_landmarks:
                frame = self.eye_tracker.draw_eye_info(frame, eye_data)
                frame = self.head_pose_estimator.draw_head_pose(frame, head_pose_data)

            if self.mouse_control_enabled:
                screen_x, screen_y = self.calibration.map_gaze_to_screen(gaze_x, gaze_y)
                self.mouse_controller.update_cursor(screen_x, screen_y)

                if blink_data.get("blink_detected", False):
                    self.mouse_controller.handle_blink_action(blink_data)

            self._update_info_labels(blink_data, head_pose_data, gaze_x, gaze_y)
        else:
            cv2.putText(
                frame,
                "No face detected",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
            )

        elapsed = time.time() - self.fps_start_time
        if elapsed >= 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.fps_start_time = time.time()

        self.frame_count += 1

        return frame

    def _update_info_labels(
        self, blink_data: dict, head_pose_data: dict, gaze_x: float, gaze_y: float
    ):
        self.fps_label.configure(text=f"FPS: {self.fps:.1f}")
        self.ear_label.configure(text=f"EAR: {blink_data.get('avg_ear', 0):.3f}")
        self.blink_label.configure(text=f"Blinks: {blink_data.get('blink_count', 0)}")

        direction = head_pose_data.get("head_direction", "--")
        self.direction_label.configure(text=f"Head: {direction}")

        self.gaze_label.configure(text=f"Gaze: ({gaze_x:.3f}, {gaze_y:.3f})")

        status = []
        if self.calibrating:
            status.append("CALIBRATING")
        if self.calibration.is_calibrated:
            status.append("CALIBRATED")
        if self.mouse_control_enabled:
            status.append("MOUSE ON")

        self.status_label.configure(text=f"Status: {' | '.join(status) or 'Active'}")

    def _display_frame(self, frame: np.ndarray):
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()

        if canvas_width <= 1 or canvas_height <= 1:
            return

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        frame_h, frame_w = frame_rgb.shape[:2]

        scale = min(canvas_width / frame_w, canvas_height / frame_h)
        new_w = int(frame_w * scale)
        new_h = int(frame_h * scale)

        frame_resized = cv2.resize(frame_rgb, (new_w, new_h))

        image = Image.fromarray(frame_resized)
        photo = ImageTk.PhotoImage(image=image)

        self.canvas.delete("all")

        x = (canvas_width - new_w) // 2
        y = (canvas_height - new_h) // 2

        self.canvas.create_image(x, y, image=photo, anchor="nw")
        self.canvas.image = photo

    def _on_closing(self):
        self._stop_tracking()
        self.root.destroy()

    def run(self):
        self.root.mainloop()


def main():
    app = EyeTrackingGUI()
    app.run()


if __name__ == "__main__":
    main()
