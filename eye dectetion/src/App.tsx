import { useEyeTracker } from "./hooks/useEyeTracker";
import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const { state, videoRef, canvasRef, startCamera, stopCamera, toggleLandmarks } =
    useEyeTracker();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not enumerate devices:", err);
      }
    }
    getDevices();
  }, []);

  const handleStart = async () => {
    setError("");
    try {
      await startCamera();
    } catch (err: unknown) {
      console.error("Camera error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Camera error: ${errorMessage}`);
    }
  };

  const statusClass = state.isDistracted ? "alert" : state.isFocusedNow ? "focus" : "warn";
  const statusText = state.isDistracted
    ? "DISTRACTED"
    : state.isFocusedNow
      ? "FOCUSED"
      : "LOOKING AWAY";

  return (
    <div className="app-container">
      <header className="header">
        <h1>Eye Tracking - Distraction Monitor</h1>
        <div className="status">
          <span className={`status-badge ${statusClass}`}>{statusText}</span>
          <span className="fps">FPS: {state.fps}</span>
        </div>
      </header>

      <main className="main-content">
        <div className="video-container">
          <video ref={videoRef} playsInline style={{ display: "none" }} />
          <canvas ref={canvasRef} className="tracking-canvas" />
          {!state.isRunning && (
            <div className="placeholder">
              <p>Click "Start Tracking" to begin</p>
            </div>
          )}
        </div>

        <aside className="info-panel">
          <div className="info-section">
            <h3>Camera</h3>
            {cameras.length > 0 ? (
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={state.isRunning}
                className="camera-select"
              >
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            ) : (
              <p className="error-text">No cameras found</p>
            )}
            {error && <p className="error-text">{error}</p>}
          </div>

          <div className="info-section">
            <h3>Detection Info</h3>
            {state.isDistracted && (
              <p className="alert-text">Reason: {state.distractionReason}</p>
            )}
            {state.eyeData && (
              <div className="metrics">
                <p>
                  Left Gaze:{" "}
                  {(
                    (state.eyeData.leftIrisNormalized.x + state.eyeData.leftIrisNormalized.y) /
                    2
                  ).toFixed(2)}
                </p>
                <p>
                  Right Gaze:{" "}
                  {(
                    (state.eyeData.rightIrisNormalized.x + state.eyeData.rightIrisNormalized.y) /
                    2
                  ).toFixed(2)}
                </p>
              </div>
            )}
            {state.blinkData && (
              <div className="metrics">
                <p>Eye Aspect Ratio: {state.blinkData.avgEar.toFixed(3)}</p>
                <p>Eyes: {state.blinkData.eyesClosed ? "Closed" : "Open"}</p>
              </div>
            )}
            {state.headPoseData && (
              <div className="metrics">
                <p>Head: {state.headPoseData.headDirection}</p>
                {state.headPoseData.eulerAngles && (
                  <>
                    <p>Yaw: {state.headPoseData.eulerAngles.yaw.toFixed(1)}°</p>
                    <p>Pitch: {state.headPoseData.eulerAngles.pitch.toFixed(1)}°</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="controls">
            <button
              className={`btn ${state.isRunning ? "stop" : "start"}`}
              onClick={state.isRunning ? stopCamera : handleStart}
            >
              {state.isRunning ? "Stop Tracking" : "Start Tracking"}
            </button>
            {error && <p className="error-text">{error}</p>}
            <button
              className="btn toggle"
              onClick={toggleLandmarks}
              disabled={!state.isRunning}
            >
              {state.showLandmarks ? "Hide" : "Show"} Landmarks
            </button>
          </div>

          <div className="help-text">
            <p>Press L to toggle landmarks</p>
            <p>Press C to recalibrate</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
