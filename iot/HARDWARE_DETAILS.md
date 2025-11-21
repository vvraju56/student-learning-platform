# Hardware Components - Detailed Specifications

## 1. ESP32 Development Board

**Model:** NodeMCU-32S or equivalent  
**Price:** $5-15 USD  
**Specs:**
- Processor: Dual-core Xtensa LX6 @ 240MHz
- RAM: 520 KB SRAM
- Flash: 4 MB
- WiFi: 802.11 b/g/n
- Bluetooth: 4.2 LE + Classic
- GPIO: 34 pins
- ADC: 12-bit, 18 channels

**Pinout Reference:**
\`\`\`
         ┌─────────────────┐
    EN ─┤1             34─┤ GPIO34
    IO36─┤2             35─┤ GPIO35
    IO39─┤3             32─┤ GPIO32 (IR Sensor)
    IO34─┤4             33─┤ GPIO33 (LED Alert)
    IO35─┤5             25─┤ GPIO25 (PIR)
    IO32─┤6             26─┤ GPIO26 (Ultrasonic TRIG)
    IO33─┤7             27─┤ GPIO27 (Ultrasonic ECHO)
    IO25─┤8             14─┤ GPIO14
    IO26─┤9             12─┤ GPIO12
    IO27─┤10            13─┤ GPIO13
    GND─┤11            23─┤ GPIO23
    IO14─┤12            22─┤ GPIO22 (SCL)
    IO12─┤13            19─┤ GPIO19
    IO13─┤14            18─┤ GPIO18
    SD2 ─┤15            17─┤ GPIO17
    SD3 ─┤16            16─┤ GPIO16
    CMD ─┤17             4─┤ GPIO4
    CLK ─┤18             0─┤ GPIO0
    SD0 ─┤19             2─┤ GPIO2
    SD1 ─┤20             15─┤ GPIO15
    3V3 ─┤21            21─┤ GPIO21 (SDA)
    GND ─┤22             5─┤ GPIO5
    IO11─┤23             3─┤ RX0
    IO10─┤24             1─┤ TX0
    IO9 ─┤25            GND─┤ GND
    IO8 ─┤26            5V ─┤ 5V
    IO7 ─┤27           3V3─┤ 3V3
         └─────────────────┘
\`\`\`

---

## 2. MPU6050 Accelerometer/Gyroscope

**Price:** $5-10 USD  
**Purpose:** Detect student posture by measuring tilt angle  
**Specs:**
- Axes: 6-axis (3-axis accelerometer + 3-axis gyroscope)
- Accelerometer range: ±2g, ±4g, ±8g, ±16g
- Gyroscope range: ±250°/s to ±2000°/s
- Communication: I2C (address: 0x68)
- Voltage: 3.3V-5V

**Wiring:**
\`\`\`
MPU6050    ESP32
─────────────────
VCC   ──→  3.3V
GND   ──→  GND
SDA   ──→  GPIO21 (I2C Data)
SCL   ──→  GPIO22 (I2C Clock)
INT   ──→  (optional, for interrupts)
\`\`\`

**How It Works:**
- Measures gravitational acceleration in X, Y, Z axes
- Calculates tilt angle: `angle = atan2(accelX, sqrt(accelY² + accelZ²))`
- Forward lean > 15° = bad posture alert
- Resolution: ~0.1° accuracy

---

## 3. HC-SR04 Ultrasonic Sensor

**Price:** $2-5 USD  
**Purpose:** Measure distance (how close student is to screen)  
**Specs:**
- Frequency: 40 kHz
- Range: 2cm to 400cm
- Accuracy: ±0.3cm
- Response time: ~60ms
- Operating voltage: 5V

**Wiring:**
\`\`\`
HC-SR04    ESP32
──────────────────
VCC   ──→  5V
GND   ──→  GND
TRIG  ──→  GPIO26 (Trigger)
ECHO  ──→  GPIO27 (Echo)
\`\`\`

**How It Works:**
1. Send 10µs pulse to TRIG pin
2. Sensor emits ultrasonic wave
3. ECHO pin goes HIGH when sound returns
4. Measure pulse duration: `distance = duration × 0.034 / 2` cm
5. Distance < 30cm = alert (leaning too close)

**Placement:**
- Mount facing the student's head/face
- Clear line of sight required
- Avoid corners and reflective surfaces

---

## 4. PIR Motion Sensor (HC-SR501)

**Price:** $1-3 USD  
**Purpose:** Detect presence (is student still there?)  
**Specs:**
- Detection angle: 120°
- Detection range: 5-7 meters
- Sensitivity: Adjustable pot on board
- Operating voltage: 5V-12V (use 5V)
- Output: HIGH when motion detected

**Wiring:**
\`\`\`
PIR Sensor    ESP32
──────────────────────
VCC      ──→  5V
GND      ──→  GND
OUT      ──→  GPIO25
\`\`\`

**How It Works:**
- Passive Infrared sensor detects heat signatures
- Automatically calibrates first 60 seconds
- Goes HIGH for ~5 seconds when motion detected
- False negatives if student is still (OK for our use)
- Can adjust sensitivity with on-board potentiometer

**Placement:**
- Mount where it faces the student
- Avoid direct sunlight
- Calibrate after power-on

---

## 5. IR Sensor Module (Face Detection)

**Price:** $3-8 USD  
**Purpose:** Detect if student is looking at screen (face detection)  
**Specs:**
- Wavelength: 940nm IR LED
- Detection range: 20-30cm
- Analog output: 0-4095 (ESP32 ADC)
- Operating voltage: 3.3V-5V
- Response time: ~5ms

**Wiring:**
\`\`\`
IR Sensor    ESP32
─────────────────────
VCC     ──→  3.3V/5V
GND     ──→  GND
AO      ──→  GPIO32 (Analog)
DO      ──→  (optional digital)
\`\`\`

**Calibration:**
\`\`\`cpp
// Pointing at face: ~2500
// No face: ~800
// Adjust threshold: 1500 (in code)
\`\`\`

**How It Works:**
- IR LED emits infrared light
- Phototransistor receives reflected IR
- Analog voltage indicates reflectance
- High value = face present
- Low value = no face

**Placement:**
- Mount on monitor bezel pointing at student
- Adjust angle to face position
- Clean lens regularly

---

## 6. LED Alert Indicator

**Price:** $0.1 USD  
**Purpose:** Visual feedback for alerts on ESP32  
**Specs:**
- Color: Red recommended
- Voltage: 3.3V
- Current: ~5-10mA
- Resistor: 220Ω for 3.3V

**Wiring:**
\`\`\`
LED    ESP32 (via 220Ω resistor)
──────────────────────────────────
Anode (long leg) ──→ GPIO33
Cathode (short leg) ──→ GND
     [220Ω resistor in series]
\`\`\`

**Behavior:**
- Blinks once = Posture alert
- Blinks twice = No face alert
- LED stays on during alert

---

## 7. Breadboard & Wiring

**Components:**
- Solderless breadboard (400+ holes)
- Jumper wires (male-to-male, male-to-female)
- USB cable (Micro-B for ESP32)
- Power supply optional (5V/2A)

**Assembly Tips:**
1. Place ESP32 on breadboard
2. Connect power rails (5V, 3.3V, GND)
3. Add I2C pullup resistors (4.7kΩ) on SDA/SCL if needed
4. Use colored wires for organization:
   - Red = 5V
   - Orange = 3.3V
   - Black = GND
   - Green/Blue = Signal

---

## 8. Complete Bill of Materials (BOM)

| Item | Quantity | Price | Link |
|------|----------|-------|------|
| ESP32 NodeMCU-32S | 1 | $12 | Amazon/AliExpress |
| MPU6050 Module | 1 | $8 | Amazon/AliExpress |
| HC-SR04 Ultrasonic | 1 | $4 | Amazon/AliExpress |
| PIR Motion Sensor | 1 | $2 | Amazon/AliExpress |
| IR Sensor Module | 1 | $5 | Amazon/AliExpress |
| Red LED (5mm) | 1 | $0.5 | Local/Amazon |
| Resistors (220Ω, 4.7kΩ) | 5 | $1 | Local/Amazon |
| Breadboard | 1 | $3 | Amazon |
| Jumper Wires | 1 | $2 | Amazon |
| USB Micro Cable | 1 | $2 | Local/Amazon |
| **Total** | | **$40** | |

---

## 9. Sensor Placement Diagram

\`\`\`
┌─────────────────────────────────────┐
│          Monitor Screen             │
│                                     │
│  [IR Sensor on top bezel]          │
│                                     │
│  ╔═════════════════════════════╗   │
│  ║                             ║   │
│  ║      [Display Area]         ║   │
│  ║                             ║   │
│  ║   [Student Viewing Here]    ║   │
│  ╚═════════════════════════════╝   │
│                                     │
└─────────────────────────────────────┘

     ┏━━━━━━━━━━━━━━━━━━━━━┓
     ┃  ESP32 Board        ┃
     ┃  ┌───────────────┐  ┃  [HC-SR04 Ultrasonic]
     ┃  │ GPIO25: PIR   │  ┃  └─→ Facing forward
     ┃  │ GPIO26/27: US │  ┃
     ┃  │ GPIO32: IR    │  ┃  [PIR Sensor]
     ┃  │ GPIO33: LED   ┃  ┃  └─→ On side
     ┃  │ GPIO21/22: I2C│  ┃
     ┃  │ [MPU6050]     │  ┃  [MPU6050]
     ┃  └───────────────┘  ┃  └─→ Mounted on device
     ┗━━━━━━━━━━━━━━━━━━━━━┛

     Positioned at eye level, 30-50cm from student
\`\`\`

---

## 10. Alternative Sensors

If specific sensors are unavailable:

| Sensor | Alternatives |
|--------|---------------|
| MPU6050 | MPU6000, ICM-20689, BMI160 |
| HC-SR04 | VL53L0X (I2C ToF), JSN-SR04T |
| PIR | RCWL-0516 (microwave sensor) |
| IR Sensor | ML8511 (UV), LM393 (generic IR) |

---

Last Updated: 2025
