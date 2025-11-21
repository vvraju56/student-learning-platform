# Complete Testing Guide: ESP32 to React Dashboard

## Part 1: Hardware & Setup Verification

### Step 1: Verify Hardware Connections
- [ ] ESP32 USB connected to computer
- [ ] All sensors wired correctly (see SETUP_GUIDE.md)
- [ ] No loose connections or short circuits
- [ ] Power LED on ESP32 is green

### Step 2: Arduino IDE Upload
\`\`\`bash
1. Open Arduino IDE
2. File → Open → esp32_student_monitoring.ino
3. Update credentials:
   - WIFI_SSID = Your WiFi network name
   - WIFI_PASSWORD = Your WiFi password
   - API_KEY = From Firebase Project Settings
   - FIREBASE_PROJECT_ID = Your project ID
   - DATABASE_URL = From Firebase Console
4. Tools → Port → Select your ESP32 COM port
5. Sketch → Upload
6. Tools → Serial Monitor (115200 baud)
\`\`\`

### Step 3: Check Serial Output
Look for this sequence:
\`\`\`
=== ESP32 Student Monitoring System ===
Connecting to WiFi: YOUR_SSID
..........
WiFi connected!
IP: 192.168.x.x
Initializing Firebase...
MPU6050 initialized successfully
Setup complete! Ready to send data.

[Updates every 2 seconds]:
Posture Angle: 12.5 degrees
Distance: 45.3 cm
IR Value: 2100 | Face Detected: YES
Data sent to Firebase successfully
\`\`\`

**Troubleshooting Serial Output:**
| Output | Problem | Solution |
|--------|---------|----------|
| No output | USB driver issue | Install CH340 driver |
| "WiFi connected" but no IP | Network issue | Check SSID/password |
| "MPU6050 connection failed" | I2C wiring | Check SDA/SCL pins |
| "Failed to send data" | Firebase config | Verify API key and project ID |

---

## Part 2: Firebase Verification

### Step 4: Check Real-time Database
1. Go to Firebase Console → Your Project
2. Navigate to **Realtime Database**
3. Look for path: `realtime/USER_ID_HERE/current`
4. Should see data like:
\`\`\`json
{
  "userId": "USER_ID_HERE",
  "posture": "good",
  "attention": "focused",
  "distance": 45.3,
  "postureAngle": 12.5,
  "faceDetected": true,
  "timestamp": 1234567890
}
\`\`\`

**If data not appearing:**
- Check Serial Monitor shows "Data sent to Firebase successfully"
- Verify `FIREBASE_PROJECT_ID` matches exactly
- Check Realtime Database rules are applied (paste from `firebase-rules-firestore.json`)

### Step 5: Check Firestore Alerts
1. Go to Firebase Console → Firestore Database
2. Look for collection: **alerts**
3. Expand `alerts/{USER_ID_HERE}/incidents`
4. When you tilt ESP32 > 15°, new documents should appear:
\`\`\`json
{
  "userId": "USER_ID_HERE",
  "type": "BAD_POSTURE",
  "message": "Student leaning forward - angle: 22.5",
  "timestamp": 1234567890,
  "severity": "high"
}
\`\`\`

**If alerts not appearing:**
- Manually tilt sensor past 15° threshold
- Check Serial Monitor shows "Alert logged to Firestore"
- Verify Firestore rules are applied (paste from `firebase-rules-firestore.rules`)

### Step 6: Trigger Manual Alerts
Test the sensor triggers:

**Test Bad Posture Alert:**
1. Tilt ESP32 more than 15 degrees
2. Should see LED blink on ESP32
3. Check Serial Monitor: "ALERT: Student leaning forward"
4. Verify alert appears in Firestore

**Test No Face Detection:**
1. Cover IR sensor on ESP32
2. Should see LED blink
3. Check Serial Monitor: "ALERT: Face detection lost"
4. Verify alert appears in Firestore

---

## Part 3: React App Verification

### Step 7: Start React App
\`\`\`bash
cd your-project
npm run dev
\`\`\`

### Step 8: Create Account & Login
1. Register new account: `/register`
2. Use any email/password (e.g., student@test.com / password123)
3. Should redirect to dashboard

### Step 9: Verify Dashboard Updates
1. Open Dashboard page
2. Should see:
   - Real-time posture score (changes every 5 seconds)
   - Real-time attention score
   - Status cards: "Good Posture" / "Focused"
   - Distance meter
3. If values don't change, check:
   - User is logged in
   - MonitoringContext is loaded
   - Check browser console for errors

### Step 10: Verify Alerts Page
1. Go to Alerts page
2. Should show alerts from ESP32
3. Try tilting ESP32 > 15° and refresh
4. New alert should appear

### Step 11: Verify Reports Page
1. Go to Reports page
2. Charts should display:
   - Weekly posture data
   - Alert frequency
   - Performance breakdown
3. Data updates as new alerts are logged

---

## Part 4: Full Integration Test

### Scenario: Complete Study Session

1. **Setup:**
   - ESP32 running with Serial Monitor open
   - React app open on Dashboard page
   - Firebase Console open in another tab

2. **Test Sequence:**
   \`\`\`
   Time 0s:   ESP32 starts, shows setup complete
   Time 5s:   React Dashboard shows real-time scores
   Time 10s:  Tilt ESP32 > 15°
   Time 12s:  LED blinks on ESP32, alert logged
   Time 15s:  Go to Alerts page, new alert visible
   Time 20s:  Verify alert in Firebase Console
   Time 25s:  Check Reports page updated
   \`\`\`

3. **Verify Data Flow:**
   - ESP32 sends data ✓
   - Firebase receives data ✓
   - React receives updates ✓
   - Alerts triggered correctly ✓
   - All pages show correct data ✓

### Scenario: Multiple Students

To test with multiple ESP32s/students:

1. Create another registration: `student2@test.com`
2. Change ESP32 `userId = "student_002"`
3. Re-upload to another ESP32
4. Both should send data to separate Firestore collections
5. Each user only sees their own data (enforced by security rules)

---

## Part 5: Performance & Optimization

### Monitor Data Usage
- ESP32 sends: ~200 bytes every 2 seconds = ~100 KB/hour
- Monthly estimate: ~72 MB (very reasonable)

### Monitor Firebase Operations
1. Firebase Console → Usage tab
2. Should see:
   - Realtime Database reads/writes (expected)
   - Firestore reads/writes (for alerts)
   - No errors or throttling

### Network Troubleshooting
| Issue | Check | Solution |
|-------|-------|----------|
| High latency | WiFi signal strength | Move ESP32 closer to router |
| Intermittent data | WiFi drops | Check auto-reconnect in code |
| Firestore quota exceeded | Usage tab | Implement data pruning |

---

## Part 6: Deployment Checklist

Before deploying to production:

### Security
- [ ] Change `postureThreshold` to 20° (calibrated value)
- [ ] Remove hardcoded test credentials
- [ ] Enable HTTPS for all communications
- [ ] Implement proper user authentication

### Data Retention
- [ ] Set Firestore auto-delete policy for old alerts
- [ ] Archive old monitoring data
- [ ] Implement data export for compliance

### Monitoring
- [ ] Set up alerts in Firebase Console for quota limits
- [ ] Enable detailed logging for debugging
- [ ] Monitor ESP32 uptime and connection stability

### Scale Testing
- [ ] Test with 10+ ESP32 devices
- [ ] Verify database performance under load
- [ ] Check React app with high-frequency updates

---

## Quick Reference Commands

### Firebase CLI (if installed)
\`\`\`bash
# List all Firestore documents
firebase firestore:get alerts/{userId}/incidents

# Delete all alerts for a user
firebase firestore:delete alerts/{userId}/incidents --recursive

# Export data for backup
firebase firestore:export ./backup.json
\`\`\`

### Arduino Serial Monitor Tips
\`\`\`
- Ctrl+A = Select all output
- Ctrl+L = Clear output
- Right-click → Save output to file
- Baud rate MUST be 115200
\`\`\`

---

Last Updated: 2025
