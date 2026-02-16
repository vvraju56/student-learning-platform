# AI Monitoring System - Implementation Guide

## 🎯 OVERVIEW

This is a production-ready AI monitoring system that ensures video learning progress is counted ONLY when students are genuinely attentive and present.

## 📁 FILE STRUCTURE

```
├── hooks/
│   └── use-aimonitoring.ts          # Core monitoring hook
├── components/
│   └── ai-monitoring-system.tsx     # Monitoring UI component
├── app/
│   └── demo-course/
│       └── page.tsx                # Demo course page
├── public/
│   └── models/                     # Face detection models
└── MODELS_SETUP.md                  # Model setup instructions
```

## 🚀 QUICK SETUP

### 1. Install Dependencies
```bash
npm install face-api.js@^0.22.2 @types/face-api.js@^0.22.2
```

### 2. Setup Face Detection Models
```bash
# Follow MODELS_SETUP.md to download models to public/models/
```

### 3. Add to Your Course Page
```tsx
import AIMonitoringComponent from "@/components/ai-monitoring-system"

// In your course component
<AIMonitoringComponent
  videoRef={videoRef}
  userId={user.id}
  courseId={course.id}
  videoId={video.id}
  onProgressUpdate={handleProgressUpdate}
/>
```

## 🔧 CORE FEATURES

### ✅ Face Detection
- **Real-time**: Detects face every 400ms
- **Lightweight**: Uses tiny_face_detector model (~2MB)
- **Privacy-first**: All processing in browser, no video storage
- **Fallback**: Graceful degradation if models fail

### ✅ Tab Switch Detection
- **Visibility API**: Uses `document.visibilitychange`
- **Window Focus**: Tracks blur/focus events
- **Immediate Response**: Pauses progress instantly on tab switch

### ✅ Enforcement Logic
- **Single Source of Truth**: `canCountTime` boolean controls everything
- **Hard Stops**: Timer stops immediately on ANY violation
- **Video Control**: Auto-pauses video when conditions not met
- **Violation Limits**: 10 violations = video invalidated

### ✅ Progress Tracking
- **Valid Time Only**: Counts only when ALL conditions met
- **Firebase Ready**: Saves progress every 30 seconds
- **Performance**: Debounced saves, no excessive writes

## 🧮 ENFORCEMENT ALGORITHM

```typescript
// Single source of truth
const canCountTime = 
  monitoringActive &&    // User started monitoring
  cameraActive &&       // Camera permission granted
  faceDetected &&       // Face present in frame
  tabVisible &&        // Tab is active
  videoPlaying &&       // Video is playing
  !videoInvalidated     // Under violation limit

// Timer controlled by enforcement
useEffect(() => {
  if (!canCountTime) return;  // ⛔ BLOCK
  
  const interval = setInterval(() => {
    setValidWatchTime(prev => prev + 1)  // ✅ COUNT
  }, 1000);
  
  return () => clearInterval(interval);
}, [canCountTime]);  // React controls based on violations
```

## 🧪 TESTING CHECKLIST

### ✅ Hide Camera Test
1. Start monitoring
2. Cover camera with hand
3. **Expected**: Timer stops, video pauses, console shows "Face missing → Progress blocked"

### ✅ Tab Switch Test  
1. Start video
2. Switch to different browser tab
3. **Expected**: Video pauses, timer stops, console shows "Tab switched → Progress blocked"

### ✅ Return Test
1. Return to course tab
2. Uncover camera
3. **Expected**: Video resumes, timer continues

### ✅ Violation Limit Test
1. Hide/show face 11 times
2. **Expected**: Video marked invalid, progress no longer counted

## 🔒 PRIVACY & PERFORMANCE

### Privacy
- ✅ No video recorded or stored
- ✅ No images saved to server
- ✅ All processing in browser
- ✅ Models loaded from CDN/local

### Performance
- ✅ Lightweight models (2MB total)
- ✅ Optimized detection interval (400ms)
- ✅ Debounced Firebase saves (30s)
- ✅ Minimal CPU impact

## 🔧 CUSTOMIZATION

### Detection Sensitivity
```typescript
// In use-aimonitoring.ts
const DETECTION_INTERVAL = 400  // Faster = more sensitive
const VIOLATION_LIMIT = 10      // Adjust strictness
```

### Model Selection
```typescript
// Use different models for accuracy vs speed
await faceapi.nets.tinyFaceDetector.loadFromUri('/models')  // Fast
await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')  // Accurate
```

### UI Customization
```tsx
// Modify ai-monitoring-system.tsx
// Add custom indicators, change colors, add alerts
```

## 🌐 PRODUCTION DEPLOYMENT

### Firebase Integration
Replace `saveProgressToFirebase()` with your actual Firebase function:

```typescript
import { doc, updateDoc } from "firebase/firestore"

const saveProgressToFirebase = async () => {
  if (!userId || !courseId || !videoId) return
  
  await updateDoc(doc(db, `users/${userId}/progress/${courseId}`), {
    [`${videoId}_validTime`]: validWatchTime,
    [`${videoId}_completed`]: validWatchTime >= duration * 0.8,
    lastUpdated: new Date()
  })
}
```

### Environment Variables
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
```

## 📊 ANALYTICS & REPORTING

The system tracks:
- Valid watch time
- Violation counts (face missing, tab switches)
- Completion status
- Real-time compliance

All data can be exported for compliance reporting.

## 🚀 GO LIVE

1. **Install models** to `/public/models/`
2. **Update dependencies** in package.json
3. **Replace demo course data** with your course API
4. **Add Firebase config** for progress saving
5. **Test thoroughly** with all violation scenarios
6. **Deploy** to production

---

## 🎓 RESULT

You now have a production-ready AI monitoring system that:

- ✅ **Prevents cheating** via face detection + tab tracking
- ✅ **Ensures authentic learning** with enforcement logic  
- ✅ **Protects privacy** with browser-only processing
- ✅ **Scales efficiently** with optimized performance
- ✅ **Integrates seamlessly** with existing course platforms

**"Progress is counted only when the student is genuinely present and attentive."**