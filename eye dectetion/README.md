# Eye Tracker

A real-time eye tracking application that monitors focus and attention using computer vision and facial landmark detection.

## What It Can Do

### 1. Real-Time Eye Tracking
The application uses Google's MediaPipe Face Mesh to detect and track 468 facial landmarks in real-time. It specifically tracks eye movements by analyzing the iris position relative to the eye corners. This allows the system to determine where you are looking on screen.

### 2. Focus & Attention Monitoring
The system continuously monitors whether you are focused or distracted by checking:
- **Gaze Direction** - Are you looking at the screen?
- **Head Orientation** - Is your head turned away?
- **Eye Closure** - Are your eyes closed?

When any of these conditions occur for more than 1.5 seconds, the system flags you as "distracted" and displays an alert on screen.

### 3. Blink Detection
The blink detector monitors your eyes in real-time and can:
- Detect when both eyes are closed
- Track blink frequency
- Identify prolonged eye closure

This is useful for detecting drowsiness or attention loss.

### 4. Head Pose Estimation
The head pose estimator calculates the orientation of your head in 3D space:
- **Yaw** (left/right rotation)
- **Pitch** (up/down tilt)

If your head turns more than 20 degrees in any direction, the system considers you distracted.

### 5. Screen Calibration
For accurate gaze tracking, you can calibrate the system:
1. Look at different points on your screen
2. The system maps your eye position to screen coordinates
3. This improves accuracy significantly

Press **C** to start calibration.

### 6. Mouse Control (Optional)
Once calibrated, you can use your eye gaze to control the mouse cursor. Move your eyes to move the cursor. This enables hands-free computer operation.

### 7. Visual Alerts
When distracted, the application:
- Draws a red border around the video feed
- Displays "DISTRACTED!" message
- Shows the reason (Looking Away, Head Turned, or Eyes Closed)

## Features

- Real-time eye tracking at 30+ FPS
- Face mesh detection with 468 landmarks
- Combined gaze estimation from both eyes
- Configurable distraction threshold
- Toggle-able landmark visualization
- FPS counter for performance monitoring

## Requirements

```
opencv-python>=4.8.0
mediapipe>=0.10.0
numpy>=1.24.0
pyautogui>=0.9.54
customtkinter>=5.2.0
Pillow>=10.0.0
```

## Installation

```bash
pip install -r requirements.txt
```

## Usage

Run the main eye tracking application:

```bash
python main.py
```

The application will:
1. Open your default camera
2. Display a video window with eye tracking
3. Show "FOCUSED" or "DISTRACTED" status
4. Draw eye landmarks on the video feed

### Controls

| Key | Action |
|-----|--------|
| ESC | Exit the application |
| C | Recalibrate the screen mapping |
| L | Toggle landmark visibility |

### Calibration

For best accuracy, calibrate the system by looking at the 9 points on screen as prompted. This creates a mapping between your eye position and screen coordinates.

## Project Structure

| File | Description |
|------|-------------|
| `main.py` | Main application entry point |
| `eye_tracker.py` | Core eye tracking and gaze detection |
| `blink_detector.py` | Blink detection logic |
| `head_pose.py` | Head pose estimation |
| `calibration.py` | Screen calibration system |
| `mouse_controller.py` | Mouse control functionality |
| `gui_app.py` | GUI interface (optional) |
| `face_landmarker.task` | MediaPipe model file |

## Use Cases

- **Study/Work Focus Tracker** - Monitor your attention while studying or working
- **Presentation Tool** - Know when your audience is paying attention
- **Accessibility** - Hands-free computer control for users with limited mobility
- **Drowsiness Detection** - Alert when someone is falling asleep

## License

MIT