# Face Detection Models Setup

This directory contains the face detection models for the AI monitoring system.

## Required Models

Download these models from face-api.js repository and place in `/public/models/`:

### Face Detection Models
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

### Face Landmark Models  
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

## Download Commands

```bash
# Create models directory
mkdir -p public/models

# Download models (from face-api.js official repo)
curl -L https://github.com/justadud/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json -o public/models/tiny_face_detector_model-weights_manifest.json

curl -L https://github.com/justadud/face-api.js/raw/master/weights/tiny_face_detector_model-shard1 -o public/models/tiny_face_detector_model-shard1

curl -L https://github.com/justadud/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json -o public/models/face_landmark_68_model-weights_manifest.json

curl -L https://github.com/justadud/face-api.js/raw/master/weights/face_landmark_68_model-shard1 -o public/models/face_landmark_68_model-shard1
```

## Alternative: Use CDN Models

If you prefer not to host models locally, modify the hook to load from CDN:

```typescript
await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights')
await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights')
```

## Model Information

- **tiny_face_detector**: Lightweight face detection (fast, good for real-time)
- **face_landmark_68**: 68 facial landmark points for improved detection accuracy
- **Size**: ~2MB total (lightweight for browser loading)
- **Privacy**: All processing happens locally in browser

## Performance Notes

- Models load once at application start
- Detection runs every 400ms for real-time responsiveness
- Minimal CPU impact with lightweight models
- No server processing required