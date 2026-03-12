#include <WiFi.h>
#include <time.h>
#include <sys/time.h>
#include <Firebase_ESP_Client.h>

// ===================== WIFI =====================
#define WIFI_SSID       "esp32"
#define WIFI_PASSWORD   "esp123456"

// ==================== FIREBASE ==================
#define API_KEY         "AIzaSyB4srsDIHhr1RBWwHcqexKBZbN2zQAFAkE"
#define DATABASE_URL    "https://student-learing-56-default-rtdb.asia-southeast1.firebasedatabase.app/"

// Use the SAME Firebase Auth user as website login for this UID.
#define USER_EMAIL      "vishnuraju922732@gmail.com"
#define USER_PASSWORD   "raju@2005"
#define USER_UID        "0JkDX6zFv4f7nJkRe1ISggX0WXo2"
#define DEVICE_ID       "esp32-01"

// ================ SENSOR + ALERT PINS ================
// Ultrasonic (HC-SR04)
#define TRIG_PIN        5
#define ECHO_PIN        18

// Alerts
#define LED_PIN         14
#define BUZZER_PIN      26

const bool LED_ACTIVE_HIGH = true;
const bool BUZZER_ACTIVE_HIGH = true;

// Lean threshold: distance below this means too close/leaning forward
const float LEAN_THRESHOLD_CM = 20.0;

// Timers
const unsigned long STATUS_INTERVAL_MS = 2000;  // heartbeat + sensor status
const unsigned long ALERT_POLL_MS = 700;        // read website alert commands

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String basePath;

unsigned long lastStatusTick = 0;
unsigned long lastAlertPollTick = 0;

bool postureBad = false;         // mapped to motionDetected for website logic
uint64_t lastMotionAtMs = 0;
float lastDistanceCm = 0.0;

bool cmdLed = false;
bool cmdBuzzer = false;
String cmdReason = "ok";

uint64_t epochMs() {
  struct timeval tv;
  gettimeofday(&tv, nullptr);
  return (uint64_t)tv.tv_sec * 1000ULL + (uint64_t)tv.tv_usec / 1000ULL;
}

void setOutput(uint8_t pin, bool on, bool activeHigh) {
  digitalWrite(pin, (on == activeHigh) ? HIGH : LOW);
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void syncClock() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing time");
  time_t now = time(nullptr);
  int retry = 0;
  while (now < 1700000000 && retry < 30) {
    delay(500);
    Serial.print('.');
    now = time(nullptr);
    retry++;
  }
  Serial.println(now >= 1700000000 ? " OK" : " FAILED");
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout 30ms
  if (duration == 0) return -1.0; // sensor timeout

  return (duration * 0.0343f) / 2.0f;
}

bool pushHardwareStatus() {
  if (!Firebase.ready()) return false;

  uint64_t now = epochMs();

  FirebaseJson json;
  json.set("online", true);
  json.set("lastHeartbeat", (double)now);
  json.set("lastSensorUpdate", (double)now);

  // Website uses motionDetected + lastMotionAt for 5s violation logic.
  json.set("motionDetected", postureBad);
  json.set("lastMotionAt", (double)lastMotionAtMs);

  // Extra diagnostics
  json.set("distanceCm", lastDistanceCm);
  json.set("posture", postureBad ? "Lean Forward" : "Good Posture");
  json.set("wifiRSSI", WiFi.RSSI());

  bool ok = Firebase.RTDB.updateNode(&fbdo, basePath.c_str(), &json);
  if (!ok) {
    Serial.print("RTDB status update failed: ");
    Serial.println(fbdo.errorReason());
  }
  return ok;
}

void readAlertCommand() {
  if (!Firebase.ready()) return;

  String ledPath = basePath + "/alert/led";
  String buzzerPath = basePath + "/alert/buzzer";
  String reasonPath = basePath + "/alert/reason";

  if (Firebase.RTDB.getBool(&fbdo, ledPath.c_str())) {
    cmdLed = fbdo.boolData();
  }

  if (Firebase.RTDB.getBool(&fbdo, buzzerPath.c_str())) {
    cmdBuzzer = fbdo.boolData();
  }

  if (Firebase.RTDB.getString(&fbdo, reasonPath.c_str())) {
    cmdReason = fbdo.stringData();
  }
}

void applyOutputs() {
  // Local behavior: LED follows posture issue; buzzer from website command.
  bool ledOn = cmdLed || postureBad;
  bool buzzerOn = cmdBuzzer;

  setOutput(LED_PIN, ledOn, LED_ACTIVE_HIGH);
  setOutput(BUZZER_PIN, buzzerOn, BUZZER_ACTIVE_HIGH);
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setOutput(LED_PIN, false, LED_ACTIVE_HIGH);
  setOutput(BUZZER_PIN, false, BUZZER_ACTIVE_HIGH);

  connectWiFi();
  syncClock();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  basePath = String("hardwareStatus/") + USER_UID + "/" + DEVICE_ID;

  // Initialize lastMotionAt to current time so field is valid numeric.
  lastMotionAtMs = epochMs();

  Serial.print("RTDB path: ");
  Serial.println(basePath);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    syncClock();
  }

  // Read posture (distance)
  float d = readDistanceCm();
  if (d > 0) {
    lastDistanceCm = d;
    bool currentBad = (d < LEAN_THRESHOLD_CM);

    if (currentBad && !postureBad) {
      lastMotionAtMs = epochMs();
    }

    postureBad = currentBad;
  }

  unsigned long nowTick = millis();

  if (nowTick - lastStatusTick >= STATUS_INTERVAL_MS) {
    lastStatusTick = nowTick;
    pushHardwareStatus();

    Serial.print("Distance(cm): ");
    Serial.print(lastDistanceCm, 2);
    Serial.print(" | Posture: ");
    Serial.print(postureBad ? "Lean Forward" : "Good");
    Serial.print(" | AlertReason: ");
    Serial.println(cmdReason);
  }

  if (nowTick - lastAlertPollTick >= ALERT_POLL_MS) {
    lastAlertPollTick = nowTick;
    readAlertCommand();
  }

  applyOutputs();
}

