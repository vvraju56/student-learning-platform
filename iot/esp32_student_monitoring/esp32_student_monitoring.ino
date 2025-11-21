
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050.h>
#include <time.h>
#include <ArduinoJson.h> // Requires ArduinoJson library

// ===== WiFi & Supabase Configuration =====
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Supabase Configuration
#define SUPABASE_URL "https://YOUR_PROJECT_REF.supabase.co"
#define SUPABASE_KEY "YOUR_SUPABASE_ANON_KEY"

// ===== Pin Definitions =====
#define PIR_PIN 25          // PIR motion sensor
#define ULTRASONIC_TRIG 26  // Ultrasonic trigger
#define ULTRASONIC_ECHO 27  // Ultrasonic echo
#define IR_SENSOR_PIN 32    // IR face detection
#define LED_ALERT 33        // Alert LED

// ===== Global Variables =====
MPU6050 mpu;

String userId = "USER_ID_HERE"; // Set this to the Firebase UID of the student
float postureThreshold = 15.0;  // Degrees for bad posture
long lastSensorReadTime = 0;
long lastAlertTime = 0;
const long SENSOR_INTERVAL = 2000;    // Read sensors every 2 seconds
const long ALERT_COOLDOWN = 5000;     // Alert cooldown period

// ===== Function Prototypes =====
void connectWiFi();
void initializeSensors();
float readPostureAngle();
float readDistance();
bool detectFace();
void sendDataToSupabase(float angle, float distance, bool face);
void logAlertToSupabase(String alertType, String message);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== ESP32 Student Monitoring System (Supabase) ===");
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(ULTRASONIC_TRIG, OUTPUT);
  pinMode(ULTRASONIC_ECHO, INPUT);
  pinMode(IR_SENSOR_PIN, INPUT);
  pinMode(LED_ALERT, OUTPUT);
  digitalWrite(LED_ALERT, LOW);
  
  // Connect to WiFi
  connectWiFi();
  initializeSensors();
  
  // Set time for timestamps (optional, Supabase handles timestamps)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  Serial.println("Setup complete! Ready to send data.");
}

void loop() {
  // Reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Read sensors at defined interval
  if (millis() - lastSensorReadTime >= SENSOR_INTERVAL) {
    lastSensorReadTime = millis();
    
    // Read sensor data
    float postureAngle = readPostureAngle();
    float distance = readDistance();
    bool faceDetected = detectFace();
    
    // Send data to Supabase
    sendDataToSupabase(postureAngle, distance, faceDetected);
    
    // Check for alerts
    if (postureAngle > postureThreshold && millis() - lastAlertTime > ALERT_COOLDOWN) {
      logAlertToSupabase("posture", "Student leaning forward - angle: " + String(postureAngle));
      lastAlertTime = millis();
      digitalWrite(LED_ALERT, HIGH);
      delay(200);
      digitalWrite(LED_ALERT, LOW);
    }
    
    if (!faceDetected && millis() - lastAlertTime > ALERT_COOLDOWN) {
      logAlertToSupabase("attention", "Face detection lost - Student distracted");
      lastAlertTime = millis();
      digitalWrite(LED_ALERT, HIGH);
      delay(500);
      digitalWrite(LED_ALERT, LOW);
    }
  }
  
  delay(100);
}

// ===== WiFi Connection =====
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi. Retrying...");
  }
}

// ===== Sensor Initialization =====
void initializeSensors() {
  Serial.println("Initializing sensors...");
  
  // Initialize I2C for MPU6050
  Wire.begin();
  mpu.initialize();
  
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed!");
  } else {
    Serial.println("MPU6050 initialized successfully");
  }
}

// ===== Read Posture Angle (MPU6050) =====
float readPostureAngle() {
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  
  // Calculate angle from Z-axis acceleration
  float angle = atan2(ax, sqrt(ay * ay + az * az)) * 180.0 / PI;
  
  Serial.print("Posture Angle: ");
  Serial.print(angle);
  Serial.println(" degrees");
  
  return abs(angle);
}

// ===== Read Distance (Ultrasonic) =====
float readDistance() {
  // Send trigger pulse
  digitalWrite(ULTRASONIC_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG, LOW);
  
  // Measure pulse duration
  long duration = pulseIn(ULTRASONIC_ECHO, HIGH);
  
  // Calculate distance in cm
  float distance = duration * 0.034 / 2;
  
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");
  
  return distance;
}

// ===== Detect Face (IR Sensor) =====
bool detectFace() {
  // Read IR sensor value (typically 0-4095 for ESP32 ADC)
  int irValue = analogRead(IR_SENSOR_PIN);
  
  // Threshold can be calibrated (e.g., 1500)
  bool faceDetected = irValue > 1500;
  
  Serial.print("IR Value: ");
  Serial.print(irValue);
  Serial.print(" | Face Detected: ");
  Serial.println(faceDetected ? "YES" : "NO");
  
  return faceDetected;
}

// ===== Send Data to Supabase =====
void sendDataToSupabase(float angle, float distance, bool face) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/monitoring_logs";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Prefer", "return=minimal");

  // Calculate scores based on raw data
  int postureScore = (angle > postureThreshold) ? 50 : 95;
  int attentionScore = face ? 90 : 40;

  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["user_id"] = userId;
  doc["posture_score"] = postureScore;
  doc["attention_score"] = attentionScore;
  // Note: timestamp is auto-generated by Supabase default

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    Serial.print("Supabase Data Sent. Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending data: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// ===== Log Alert to Supabase =====
void logAlertToSupabase(String alertType, String message) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/alerts";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Prefer", "return=minimal");

  StaticJsonDocument<200> doc;
  doc["user_id"] = userId;
  doc["type"] = alertType;
  doc["message"] = message;
  
  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    Serial.print("Alert Logged. Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error logging alert: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  
  Serial.print("ALERT: ");
  Serial.println(message);
}
