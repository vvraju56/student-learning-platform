import asyncio
import base64
import json
import os
import time
from typing import Any, Dict, Optional

import cv2
import numpy as np
import websockets

from blink_detector import BlinkDetector
from calibration import CalibrationSystem
from eye_tracker import EyeTracker
from head_pose import HeadPoseEstimator


def _default_payload(reason: str = "IDLE") -> Dict[str, Any]:
    return {
        "isFaceDetected": False,
        "isEyesDetected": False,
        "isEyeTrackingStable": False,
        "gazeDirection": "unknown",
        "isBlinking": False,
        "isDrowsy": False,
        "headPose": {"yaw": 0, "pitch": 0, "roll": 0},
        "gazePosition": {"x": 0.5, "y": 0.5},
        "distracted": False if reason == "IDLE" else True,
        "reason": reason,
        "cameraIndex": -1,
        "previewJpeg": "",
        "timestamp": int(time.time() * 1000),
    }


class EyeTrackingServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8001):
        self.host = host
        self.port = port
        self.eye_tracker = EyeTracker(
            min_detection_confidence=0.2,
            min_tracking_confidence=0.2,
        )
        self.blink_detector = BlinkDetector()
        self.head_pose_estimator = HeadPoseEstimator()
        self.calibration = CalibrationSystem(1920, 1080)

    def _encode_preview(self, frame: np.ndarray) -> str:
        try:
            resized = cv2.resize(frame, (320, 240))
            ok, buffer = cv2.imencode(".jpg", resized, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
            if not ok:
                return ""
            return base64.b64encode(buffer).decode("ascii")
        except Exception:
            return ""

    def _decode_frame(self, encoded: str) -> Optional[np.ndarray]:
        if not encoded or not isinstance(encoded, str):
            return None

        payload = encoded.split(",", 1)[1] if "," in encoded else encoded
        try:
            raw = base64.b64decode(payload, validate=False)
            arr = np.frombuffer(raw, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            return frame
        except Exception:
            return None

    def _analyze_frame(self, frame: np.ndarray, camera_index: int = -1) -> Dict[str, Any]:
        try:
            if frame is None or frame.size == 0:
                payload = _default_payload("BAD_FRAME")
                payload["cameraIndex"] = int(camera_index)
                return payload

            preview_jpeg = self._encode_preview(frame)
            h, w = frame.shape[:2]
            results = self.eye_tracker.find_face_mesh(frame)

            if not results or not results.face_landmarks:
                payload = _default_payload("NO FACE")
                payload["previewJpeg"] = preview_jpeg
                payload["cameraIndex"] = int(camera_index)
                return payload

            face_landmarks = results.face_landmarks[0]
            eye_data = self.eye_tracker.get_eye_landmarks(face_landmarks, (h, w))
            head_data = self.head_pose_estimator.estimate_head_pose(face_landmarks, (h, w))
            blink_data = self.blink_detector.update(face_landmarks, (h, w))
            euler = head_data.get("euler_angles", {"yaw": 0, "pitch": 0, "roll": 0})

            l_h_ratio = self.eye_tracker.calculate_gaze_ratio(eye_data["left_eye"], eye_data["left_iris"])
            r_h_ratio = self.eye_tracker.calculate_gaze_ratio(eye_data["right_eye"], eye_data["right_iris"])
            avg_h_ratio = (l_h_ratio + r_h_ratio) / 2

            l_v_ratio = self.eye_tracker.calculate_vertical_gaze_ratio(
                eye_data["left_eye"], eye_data["left_iris"]
            )
            r_v_ratio = self.eye_tracker.calculate_vertical_gaze_ratio(
                eye_data["right_eye"], eye_data["right_iris"]
            )
            avg_v_ratio = (l_v_ratio + r_v_ratio) / 2

            h_on_screen = 0.25 < avg_h_ratio < 0.75
            v_on_screen = 0.35 < avg_v_ratio < 0.75
            centered = abs(euler["yaw"]) < 20 and abs(euler["pitch"]) < 20
            eyes_open = not blink_data.get("eyes_closed", False)

            is_focused = h_on_screen and v_on_screen and centered and eyes_open
            reason = ""
            if not (h_on_screen and v_on_screen):
                reason = "LOOKING AWAY"
            elif not centered:
                reason = "HEAD TURNED"
            elif not eyes_open:
                reason = "EYES CLOSED"

            if avg_h_ratio < 0.4:
                gaze_direction = "left"
            elif avg_h_ratio > 0.6:
                gaze_direction = "right"
            else:
                gaze_direction = "center"

            return {
                "isFaceDetected": True,
                "isEyesDetected": True,
                "isEyeTrackingStable": is_focused,
                "gazeDirection": gaze_direction,
                "isBlinking": blink_data.get("blink_detected", False),
                "isDrowsy": not eyes_open,
                "headPose": euler,
                "gazePosition": {"x": avg_h_ratio, "y": avg_v_ratio},
                "distracted": not is_focused,
                "reason": reason,
                "cameraIndex": int(camera_index),
                "previewJpeg": preview_jpeg,
                "timestamp": int(time.time() * 1000),
            }
        except Exception:
            payload = _default_payload("PROCESSING_ERROR")
            payload["cameraIndex"] = int(camera_index)
            return payload

    async def _handle_client(self, websocket: websockets.WebSocketServerProtocol) -> None:
        print("Client connected")
        await websocket.send(json.dumps(_default_payload("WAITING_FOR_FRAME")))

        try:
            async for raw_message in websocket:
                try:
                    message = json.loads(raw_message)
                except json.JSONDecodeError:
                    await websocket.send(json.dumps(_default_payload("INVALID_JSON")))
                    continue

                message_type = message.get("type", "frame")

                if message_type == "ping":
                    await websocket.send(json.dumps({"type": "pong", "timestamp": int(time.time() * 1000)}))
                    continue

                if message_type != "frame":
                    await websocket.send(json.dumps(_default_payload("UNSUPPORTED_MESSAGE")))
                    continue

                frame = self._decode_frame(message.get("frame", ""))
                camera_index = int(message.get("cameraIndex", -1))
                payload = self._analyze_frame(frame, camera_index=camera_index)
                await websocket.send(json.dumps(payload))
        except websockets.ConnectionClosed:
            pass
        finally:
            print("Client disconnected")

    async def run(self) -> None:
        async with websockets.serve(
            self._handle_client,
            self.host,
            self.port,
            max_size=8 * 1024 * 1024,
            ping_interval=20,
            ping_timeout=20,
        ):
            print(f"Eye Tracking WebSocket Server started at ws://{self.host}:{self.port}")
            print("Waiting for browser frames...")
            await asyncio.Future()


def _resolve_port(default_port: int = 8001) -> int:
    value = os.getenv("PORT") or os.getenv("EYE_PORT") or str(default_port)
    try:
        return int(value)
    except ValueError:
        return default_port


if __name__ == "__main__":
    host = os.getenv("EYE_HOST", "0.0.0.0")
    port = _resolve_port(8001)
    server = EyeTrackingServer(host=host, port=port)
    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        print("Server stopped.")
    finally:
        server.eye_tracker.release()
