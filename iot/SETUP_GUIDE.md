# ESP32 Student Monitoring Setup Guide (Supabase Edition)

## Hardware Requirements

- **ESP32 Development Board** (NodeMCU-32S or similar)
- **MPU6050 Accelerometer/Gyroscope** (I2C, $5-10)
- **HC-SR04 Ultrasonic Sensor** (Distance, $2-5)
- **PIR Motion Sensor** (HC-SR501)
- **IR Sensor Module** (Face detection)
- **USB Cable** (Micro USB for programming)
- **Jumper Wires**
- **Power Supply** (5V/2A or via USB)

## Wiring Diagram

\`\`\`
ESP32          Component
-----          ---------
3.3V   ------> MPU6050 VCC
GND    ------> MPU6050 GND
21 (SDA) ----> MPU6050 SDA
22 (SCL) ----> MPU6050 SCL

26 ---------> HC-SR04 TRIG
27 ---------> HC-SR04 ECHO
5V ---------> HC-SR04 VCC
GND --------> HC-SR04 GND

25 ---------> PIR OUTPUT
32 ---------> IR SENSOR AO
33 ---------> LED ALERT (with 220Ω resistor)
\`\`\`

## Arduino IDE Setup

1. **Install Arduino IDE** from https://www.arduino.cc/en/software

2. **Add ESP32 Board:**
   - File → Preferences
   - Add to "Additional Boards Manager URLs": `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board Manager → Search "esp32" → Install

3. **Select ESP32 Board:**
   - Tools → Board → ESP32 → "Node32S" or similar

4. **Install Required Libraries:**
   - Sketch → Include Library → Manage Libraries
   - Search and install:
     - "ArduinoJson" (by Benoit Blanchon) - v6.x or v7.x
     - "MPU6050" (by Electronic Cats) - v0.0.5+

## Supabase Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Create new project
   - Note your Project URL and Anon Key

2. **Create Tables:**


3. **Update ESP32 Code:**
   \`\`\`cpp
   #define WIFI_SSID "YOUR_SSID"
   #define WIFI_PASSWORD "YOUR_PASSWORD"
   
   #define SUPABASE_URL "https://your-project.supabase.co"
   #define SUPABASE_KEY "your-anon-key"
   
   String userId = "student_001"; // Set from React app (Firebase UID)
   \`\`\`

## Upload Code

1. Plug ESP32 via USB
2. Select correct COM Port (Tools → Port)
3. Sketch → Upload
4. Monitor output at Tools → Serial Monitor (115200 baud)

## Testing Connection

### Check Serial Output:
\`\`\`
=== ESP32 Student Monitoring System (Supabase) ===
Connecting to WiFi: YOUR_SSID
..........
WiFi connected!
IP: 192.168.x.x
Initializing sensors...
MPU6050 initialized successfully
Setup complete! Ready to send data.

Posture Angle: 12.5 degrees
Distance: 45.3 cm
IR Value: 2100 | Face Detected: YES
Supabase Data Sent. Response code: 201
\`\`\`

### Verify in Supabase Dashboard:
1. Go to Table Editor → `monitoring_logs`
2. You should see new rows appearing every few seconds.
3. Go to Table Editor → `alerts`
4. You should see rows when posture/face thresholds are exceeded.

## React Integration

The React app automatically listens to Supabase data via the updated MonitoringContext. No additional setup needed beyond Supabase credentials in `.env`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "WiFi connected" but no data | Check Supabase URL and Anon Key |
| Response code 401 | Invalid API Key |
| Response code 404 | Wrong URL path (check `/rest/v1/...`) |
| MPU6050 connection failed | Check I2C wiring (SDA/SCL pins) |
| Distance always 0 | Check ultrasonic trigger/echo pins |
| No face detection | Adjust IR threshold value (1500) |

## Sensor Calibration

1. **Posture Angle:** Adjust `postureThreshold` (currently 15°)
2. **Distance Alert:** Modify in `sendDataToSupabase()` function
3. **Face Detection:** Calibrate IR threshold by printing `irValue` during testing

---

Last Updated: 2025
