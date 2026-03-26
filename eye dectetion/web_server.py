import cv2
import numpy as np
import time
import json
import asyncio
import websockets
import threading
import os
import base64
from typing import Optional

from eye_tracker import EyeTracker
from blink_detector import BlinkDetector
from head_pose import HeadPoseEstimator
from calibration import CalibrationSystem

class EyeTrackingServer:
    def __init__(self, host="127.0.0.1", port=8001):
        self.host = host
        self.port = port
        # Slightly lower thresholds for webcam variability in browser-driven setups.
        self.eye_tracker = EyeTracker(
            min_detection_confidence=0.2,
            min_tracking_confidence=0.2
        )
        self.blink_detector = BlinkDetector()
        self.head_pose_estimator = HeadPoseEstimator()
        self.calibration = CalibrationSystem(1920, 1080) # Default, will be updated by client if needed
        
        self.cap: Optional[cv2.VideoCapture] = None
        self.camera_index: int = -1
        self.running = False
        self.state_lock = threading.Lock()
        self.processing_thread: Optional[threading.Thread] = None
        self.clients = set()
        
        self.last_data = {
            "isFaceDetected": False,
            "isEyesDetected": False,
            "isEyeTrackingStable": False,
            "gazeDirection": "unknown",
            "isBlinking": False,
            "isDrowsy": False,
            "headPose": {"yaw": 0, "pitch": 0, "roll": 0},
            "gazePosition": {"x": 0.5, "y": 0.5},
            "distracted": False,
            "reason": "IDLE",
            "cameraIndex": -1,
            "previewJpeg": ""
        }

    def _encode_preview(self, frame):
        try:
            resized = cv2.resize(frame, (320, 240))
            ok, buffer = cv2.imencode(".jpg", resized, [int(cv2.IMWRITE_JPEG_QUALITY), 55])
            if not ok:
                return ""
            return base64.b64encode(buffer).decode("ascii")
        except Exception:
            return ""

    async def register(self, websocket):
        self.clients.add(websocket)
        if not self.running:
            started = await asyncio.to_thread(self.start_processing_if_needed)
            if not started:
                self.last_data = {
                    "isFaceDetected": False,
                    "isEyesDetected": False,
                    "isEyeTrackingStable": False,
                    "gazeDirection": "unknown",
                    "isBlinking": False,
                    "isDrowsy": False,
                    "headPose": {"yaw": 0, "pitch": 0, "roll": 0},
                    "gazePosition": {"x": 0.5, "y": 0.5},
                    "distracted": True,
                    "reason": "CAMERA_UNAVAILABLE",
                    "cameraIndex": -1,
                    "previewJpeg": ""
                }
        try:
            await websocket.wait_closed()
        finally:
            self.clients.discard(websocket)
            if not self.clients:
                await asyncio.to_thread(self.stop_camera)

    async def broadcast(self):
        while True:
            if self.clients:
                message = json.dumps(self.last_data)
                stale_clients = []
                for client in list(self.clients):
                    try:
                        await client.send(message)
                    except Exception:
                        stale_clients.append(client)
                for client in stale_clients:
                    self.clients.discard(client)
            await asyncio.sleep(0.1) # 10Hz update rate

    def _parse_candidate_indices(self):
        explicit_index = os.getenv("EYE_CAMERA_INDEX", "").strip()
        if explicit_index:
            try:
                return [int(explicit_index)]
            except ValueError:
                print(f"Invalid EYE_CAMERA_INDEX='{explicit_index}', falling back to auto-scan.")

        raw = os.getenv("EYE_CAMERA_CANDIDATES", "0,1,2,3")
        indices = []
        for token in raw.split(","):
            token = token.strip()
            if not token:
                continue
            try:
                value = int(token)
                if value not in indices:
                    indices.append(value)
            except ValueError:
                continue
        return indices if indices else [0, 1, 2, 3]

    def _frame_quality_score(self, frame):
        if frame is None or frame.size == 0:
            return -1.0
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean = float(np.mean(gray))
        std = float(np.std(gray))
        # Heuristic to avoid selecting black/empty virtual camera feeds.
        if mean < 6 and std < 5:
            return -1.0
        return mean + (2.0 * std)

    def _open_camera(self, index):
        backends = []
        if os.name == "nt" and hasattr(cv2, "CAP_DSHOW"):
            backends.append(cv2.CAP_DSHOW)
        backends.append(cv2.CAP_ANY)

        for backend in backends:
            try:
                cap = cv2.VideoCapture(index, backend)
            except TypeError:
                cap = cv2.VideoCapture(index)

            if cap is None or not cap.isOpened():
                if cap:
                    cap.release()
                continue
            return cap
        return None

    def start_camera(self):
        candidates = self._parse_candidate_indices()
        print(f"Camera scan candidates: {candidates}")

        best_cap = None
        best_index = -1
        best_score = float("-inf")

        for idx in candidates:
            cap = self._open_camera(idx)
            if cap is None:
                print(f"[camera:{idx}] open failed")
                continue

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

            frame = None
            # Warm-up frames
            for _ in range(10):
                ok, candidate_frame = cap.read()
                if ok and candidate_frame is not None and candidate_frame.size > 0:
                    frame = candidate_frame
                time.sleep(0.03)

            score = self._frame_quality_score(frame) if frame is not None else -1.0
            print(f"[camera:{idx}] quality score: {score:.2f}")

            if score > best_score:
                if best_cap is not None:
                    best_cap.release()
                best_cap = cap
                best_index = idx
                best_score = score
            else:
                cap.release()

        if best_cap is None:
            print("Error: Could not open any camera candidate.")
            return False

        self.cap = best_cap
        self.camera_index = best_index
        self.last_data["cameraIndex"] = int(best_index)
        self.running = True
        print(f"Selected camera index: {best_index} (score={best_score:.2f})")
        return True

    def start_processing_if_needed(self):
        with self.state_lock:
            if self.running and self.cap is not None:
                return True

            if not self.start_camera():
                return False

            self.processing_thread = threading.Thread(target=self.process_frames, daemon=True)
            self.processing_thread.start()
            return True

    def stop_camera(self):
        with self.state_lock:
            self.running = False
            if self.cap:
                try:
                    self.cap.release()
                except Exception:
                    pass
            self.cap = None
            self.camera_index = -1
            if not self.clients:
                self.last_data = {
                    "isFaceDetected": False,
                    "isEyesDetected": False,
                    "isEyeTrackingStable": False,
                    "gazeDirection": "unknown",
                    "isBlinking": False,
                    "isDrowsy": False,
                    "headPose": {"yaw": 0, "pitch": 0, "roll": 0},
                    "gazePosition": {"x": 0.5, "y": 0.5},
                    "distracted": False,
                    "reason": "IDLE",
                    "cameraIndex": -1,
                    "previewJpeg": ""
                }

    def process_frames(self):
        while self.running:
            if self.cap is None:
                break

            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue
            
            frame = cv2.flip(frame, 1)
            preview_jpeg = self._encode_preview(frame)
            h, w = frame.shape[:2]
            results = self.eye_tracker.find_face_mesh(frame)

            if results and results.face_landmarks and len(results.face_landmarks) > 0:
                face_landmarks = results.face_landmarks[0]
                eye_data = self.eye_tracker.get_eye_landmarks(face_landmarks, (h, w))
                head_data = self.head_pose_estimator.estimate_head_pose(face_landmarks, (h, w))
                blink_data = self.blink_detector.update(face_landmarks, (h, w))
                
                # Head Pose
                euler = head_data.get("euler_angles", {"yaw": 0, "pitch": 0, "roll": 0})
                
                # Gaze
                l_h_ratio = self.eye_tracker.calculate_gaze_ratio(eye_data["left_eye"], eye_data["left_iris"])
                r_h_ratio = self.eye_tracker.calculate_gaze_ratio(eye_data["right_eye"], eye_data["right_iris"])
                avg_h_ratio = (l_h_ratio + r_h_ratio) / 2
                
                l_v_ratio = self.eye_tracker.calculate_vertical_gaze_ratio(eye_data["left_eye"], eye_data["left_iris"])
                r_v_ratio = self.eye_tracker.calculate_vertical_gaze_ratio(eye_data["right_eye"], eye_data["right_iris"])
                avg_v_ratio = (l_v_ratio + r_v_ratio) / 2

                # Focused Check
                h_on_screen = 0.25 < avg_h_ratio < 0.75
                v_on_screen = 0.35 < avg_v_ratio < 0.75
                centered = abs(euler["yaw"]) < 20 and abs(euler["pitch"]) < 20
                eyes_open = not blink_data.get("eyes_closed", False)
                
                is_focused = h_on_screen and v_on_screen and centered and eyes_open
                reason = ""
                if not (h_on_screen and v_on_screen): reason = "LOOKING AWAY"
                elif not centered: reason = "HEAD TURNED"
                elif not eyes_open: reason = "EYES CLOSED"

                if avg_h_ratio < 0.4:
                    gaze_direction = "left"
                elif avg_h_ratio > 0.6:
                    gaze_direction = "right"
                else:
                    gaze_direction = "center"

                self.last_data = {
                    "isFaceDetected": True,
                    # Eyes are considered detected when face landmarks are available.
                    # Eye-open/closed state is represented separately via isDrowsy/reason.
                    "isEyesDetected": True,
                    "isEyeTrackingStable": is_focused,
                    "gazeDirection": gaze_direction,
                    "isBlinking": blink_data.get("blink_detected", False),
                    "isDrowsy": not eyes_open,
                    "headPose": euler,
                    "gazePosition": {"x": avg_h_ratio, "y": avg_v_ratio},
                    "distracted": not is_focused,
                    "reason": reason,
                    "cameraIndex": self.camera_index,
                    "previewJpeg": preview_jpeg
                }
            else:
                self.last_data = {
                    "isFaceDetected": False,
                    "isEyesDetected": False,
                    "isEyeTrackingStable": False,
                    "gazeDirection": "unknown",
                    "isBlinking": False,
                    "isDrowsy": False,
                    "headPose": {"yaw": 0, "pitch": 0, "roll": 0},
                    "gazePosition": {"x": 0.5, "y": 0.5},
                    "distracted": True,
                    "reason": "NO FACE",
                    "cameraIndex": self.camera_index,
                    "previewJpeg": preview_jpeg
                }

            # Optional: cv2.imshow for debug
            # cv2.imshow("Server Debug", frame)
            # if cv2.waitKey(1) & 0xFF == 27: break

        self.stop_camera()

    async def run(self):
        try:
            async with websockets.serve(self.register, self.host, self.port):
                print(f"Eye Tracking WebSocket Server started at ws://{self.host}:{self.port}")
                print("Waiting for client connection before opening camera...")
                await self.broadcast()
        finally:
            self.stop_camera()
            self.eye_tracker.release()

if __name__ == "__main__":
    server = EyeTrackingServer()
    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        print("Server stopped.")
