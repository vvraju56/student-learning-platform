# React Dashboard - Real-time Supabase Integration

## How React Receives Data

Your React app receives data through three channels:

### 1. Real-time Monitoring Logs (for live monitoring)
Table: `monitoring_logs`

Updates every 2 seconds from ESP32

\`\`\`json
{
  "user_id": "student_001",
  "posture_score": 95,
  "attention_score": 90,
  "timestamp": "2023-10-27T10:00:00Z"
}
\`\`\`

### 2. Alerts (for historical alerts)
Table: `alerts`

Auto-generated when thresholds exceeded

\`\`\`json
{
  "user_id": "student_001",
  "type": "posture",
  "message": "Student leaning forward - angle: 22.5",
  "timestamp": "2023-10-27T10:05:00Z"
}
\`\`\`

### 3. User Profile
Table: `users`

Stores user details, synced from Firebase Auth

\`\`\`json
{
  "id": "student_001",
  "email": "student@school.com",
  "name": "John Doe",
  "created_at": "2023-10-01T10:00:00Z"
}
\`\`\`

## Updated MonitoringContext

The MonitoringContext in your React app is configured to:

1. **Fetch alerts history** from Supabase `alerts` table
2. **Fetch quiz scores** from Supabase `quiz_scores` table
3. **Generate automatic alerts** when webcam sensor data exceeds thresholds
4. **Update dashboard** in real-time

## Dashboard Components Using Live Data

### Dashboard Page (`app/dashboard/page.tsx`)
- Displays current posture/attention status
- Shows real-time distance data
- Triggers visual alerts when thresholds exceeded

### Alerts Page (`app/alerts/page.tsx`)
- Fetches alert history from Supabase
- Shows timestamp, type, severity
- Allows clearing old alerts

### Reports Page (`app/reports/page.tsx`)
- Charts use aggregated data from alerts table
- Shows trends over time
- Calculates posture score from historical data

## Testing ESP32 → React Connection

1. **Start ESP32 with Serial Monitor open**
   - Should show "Supabase Data Sent"

2. **Open React Dashboard**
   - Should see real-time posture/attention updates (via polling or subscription)
   - LED blinks on ESP32 = Alert received

3. **Trigger Bad Posture**
   - Tilt ESP32/MPU6050 more than 15°
   - Should see alert in React dashboard
   - Check Supabase Table Editor for new alert row

4. **Trigger No Face Detection**
   - Cover IR sensor
   - Should see "distracted" status in dashboard

## Common Issues & Solutions

### Dashboard Shows "Loading" Forever
- **Check:** Supabase credentials in .env
- **Check:** User authenticated in React
- **Solution:** Verify NEXT_PUBLIC_SUPABASE_URL matches ESP32 config

### No Real-time Updates
- **Check:** ESP32 still connected to WiFi (check Serial Monitor)
- **Check:** Supabase RLS policies allow insert access
- **Solution:** Re-upload ESP32 code with correct credentials

### Alerts Not Appearing
- **Check:** RLS policies are applied
- **Check:** Alert thresholds are being exceeded (check Serial Monitor)
- **Solution:** Manually trigger alert by tilting sensor past 15°

### Data Appears in Supabase but Not in React
- **Check:** User ID matches between React and ESP32
- **Solution:** Set `userId` in ESP32 code to logged-in user's ID
- **Ensure:** User is logged in before accessing dashboard

## Future Enhancements

1. **Multiple Sensors:** Add array of ESP32 devices
2. **Advanced Analytics:** ML-based posture detection
3. **Student Groups:** Add class-level monitoring
4. **Notifications:** Push alerts to parent phones
5. **Data Export:** Generate PDF reports

---

Last Updated: 2025
