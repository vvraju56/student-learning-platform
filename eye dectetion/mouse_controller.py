import pyautogui
import numpy as np
from collections import deque
from typing import Tuple, Optional
import time


class MouseController:
    def __init__(
        self,
        screen_width: int,
        screen_height: int,
        smoothing_frames: int = 5,
        sensitivity_x: float = 1.0,
        sensitivity_y: float = 1.0,
        deadzone: float = 0.01,
    ):
        self.screen_width = screen_width
        self.screen_height = screen_height

        self.smoothing_frames = smoothing_frames
        self.sensitivity_x = sensitivity_x
        self.sensitivity_y = sensitivity_y
        self.deadzone = deadzone

        self.x_buffer = deque(maxlen=smoothing_frames)
        self.y_buffer = deque(maxlen=smoothing_frames)

        self.current_x = screen_width // 2
        self.current_y = screen_height // 2

        self.enabled = False
        self.mouse_control_active = False

        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.01

        self.last_move_time = 0
        self.move_cooldown = 0.01

        self.click_cooldown = 0.5
        self.last_click_time = 0

        self.left_eye_blink_action = "CLICK"
        self.right_eye_blink_action = "RIGHT_CLICK"
        self.both_eyes_blink_action = "DOUBLE_CLICK"

    def update_cursor(self, screen_x: int, screen_y: int) -> Tuple[int, int]:
        if not self.mouse_control_active:
            return self.current_x, self.current_y

        current_time = time.time()
        if current_time - self.last_move_time < self.move_cooldown:
            return self.current_x, self.current_y

        self.x_buffer.append(screen_x)
        self.y_buffer.append(screen_y)

        if len(self.x_buffer) > 0:
            smoothed_x = int(np.mean(self.x_buffer))
            smoothed_y = int(np.mean(self.y_buffer))
        else:
            smoothed_x = screen_x
            smoothed_y = screen_y

        dx = smoothed_x - self.current_x
        dy = smoothed_y - self.current_y

        distance = np.sqrt(dx**2 + dy**2)
        if distance < self.deadzone * min(self.screen_width, self.screen_height):
            return self.current_x, self.current_y

        adjusted_x = int(self.current_x + dx * self.sensitivity_x)
        adjusted_y = int(self.current_y + dy * self.sensitivity_y)

        adjusted_x = np.clip(adjusted_x, 0, self.screen_width - 1)
        adjusted_y = np.clip(adjusted_y, 0, self.screen_height - 1)

        self.current_x = adjusted_x
        self.current_y = adjusted_y

        if self.enabled:
            pyautogui.moveTo(adjusted_x, adjusted_y)

        self.last_move_time = current_time

        return adjusted_x, adjusted_y

    def handle_blink_action(self, blink_data: dict) -> Optional[str]:
        current_time = time.time()

        if current_time - self.last_click_time < self.click_cooldown:
            return None

        action = None

        if blink_data.get("both_blink", False):
            if self.both_eyes_blink_action and self.both_eyes_blink_action != "NONE":
                action = self.both_eyes_blink_action
        elif blink_data.get("left_blink", False):
            if self.left_eye_blink_action and self.left_eye_blink_action != "NONE":
                action = self.left_eye_blink_action
        elif blink_data.get("right_blink", False):
            if self.right_eye_blink_action and self.right_eye_blink_action != "NONE":
                action = self.right_eye_blink_action

        if action and self.enabled and self.mouse_control_active:
            self._execute_action(action)
            self.last_click_time = current_time

        return action

    def _execute_action(self, action: str):
        if action == "CLICK":
            pyautogui.click()
        elif action == "RIGHT_CLICK":
            pyautogui.rightClick()
        elif action == "DOUBLE_CLICK":
            pyautogui.doubleClick()
        elif action == "SCROLL_UP":
            pyautogui.scroll(3)
        elif action == "SCROLL_DOWN":
            pyautogui.scroll(-3)

    def enable(self):
        self.enabled = True
        self.mouse_control_active = True

    def disable(self):
        self.enabled = False
        self.mouse_control_active = False

    def toggle(self):
        self.enabled = not self.enabled
        self.mouse_control_active = self.enabled

    def set_sensitivity(self, x: float, y: float):
        self.sensitivity_x = np.clip(x, 0.1, 5.0)
        self.sensitivity_y = np.clip(y, 0.1, 5.0)

    def set_smoothing(self, frames: int):
        self.smoothing_frames = np.clip(frames, 1, 20)
        self.x_buffer = deque(self.x_buffer, maxlen=self.smoothing_frames)
        self.y_buffer = deque(self.y_buffer, maxlen=self.smoothing_frames)

    def set_deadzone(self, deadzone: float):
        self.deadzone = np.clip(deadzone, 0.0, 0.5)

    def reset(self):
        self.x_buffer.clear()
        self.y_buffer.clear()
        self.current_x = self.screen_width // 2
        self.current_y = self.screen_height // 2

    def get_status(self) -> dict:
        return {
            "enabled": self.enabled,
            "mouse_control_active": self.mouse_control_active,
            "sensitivity_x": self.sensitivity_x,
            "sensitivity_y": self.sensitivity_y,
            "smoothing_frames": self.smoothing_frames,
            "deadzone": self.deadzone,
            "current_position": (self.current_x, self.current_y),
        }
