#include <AccelStepper.h>
#include <Servo.h>
#include <LiquidCrystal.h>
#include <LedControl.h>

#define STEPS_PER_REV     4096
#define WHEEL_DIAMETER_MM 65.0
#define WHEELBASE_MM      400.0
#define MOTOR_SPEED       700.0
#define MOTOR_ACCEL       300.0
#define STEPS_PER_MM      (STEPS_PER_REV / (WHEEL_DIAMETER_MM * 3.14159))

#define M_L_IN2  7
#define M_L_IN3  8
#define M_L_IN4  9
#define M_R_IN1  2
#define M_R_IN2  3
#define M_R_IN3  4
#define M_R_IN4  5
#define TRIG_PIN   22
#define ECHO_PIN   23
#define PIR_PIN    24
#define SERVO_PIN  44
#define BUZZER_PIN 46
#define MAX_DIN    51
#define MAX_CLK    52
#define MAX_CS     53
#define LCD_RS  30
#define LCD_EN  31
#define LCD_D4  32
#define LCD_D5  33
#define LCD_D6  34
#define LCD_D7  35

AccelStepper mL(AccelStepper::HALF4WIRE, M_L_IN1, M_L_IN3, M_L_IN2, M_L_IN4);
AccelStepper mR(AccelStepper::HALF4WIRE, M_R_IN1, M_R_IN3, M_R_IN2, M_R_IN4);
Servo         trappe;
LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);
LedControl    lc(MAX_DIN, MAX_CLK, MAX_CS, 1);

float posX = 0.0;
float posY = 0.0;
float cap  = 0.0;

const byte ICON_UP[8]   = {0b00011000,0b00111100,0b01111110,0b11111111,0b00011000,0b00011000,0b00011000,0b00011000};
const byte ICON_OK[8]   = {0b00111100,0b01000010,0b10100101,0b10000001,0b10100101,0b10011001,0b01000010,0b00111100};
const byte ICON_STOP[8] = {0b11000011,0b01100110,0b00111100,0b00011000,0b00011000,0b00111100,0b01100110,0b11000011};
const byte ICON_WAIT[8] = {0b00111100,0b01000010,0b10000001,0b10000001,0b10000001,0b10000001,0b01000010,0b00111100};

void showIcon(const byte* ic) { for(int i=0;i<8;i++) lc.setRow(0,i,ic[i]); }

void lcdShow(const char* l1, const char* l2 = "") {
  lcd.clear();
  lcd.setCursor(0,0); lcd.print(l1);
  lcd.setCursor(0,1); lcd.print(l2);
}

float distanceMM() {
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long d = pulseIn(ECHO_PIN, HIGH, 30000);
  if (d == 0) return 9999.0;
  return d * 0.1715;
}

#define C4  262
#define E4  330
#define F4  349
#define G4  392
#define A4  440
#define AS4 466
#define B4  494
#define C5  523
#define D5  587
#define E5  659
#define F5  698
#define G5  784
#define A5  880
#define GS4 415

int melImperial[] = {A4,A4,A4,F4,C5,A4,F4,C5,A4,E5,E5,E5,F5,C5,GS4,F4,C5,A4};
int durImperial[] = {500,500,500,350,150,500,350,150,700,500,500,500,350,150,500,350,150,700};
int melMario[]    = {C5,C5,C5,C5,C5,C5,C5,E5,G5,G5,E5,C5,E5,G5,C5,G4,E4,A4,B4,AS4,A4,G4,E5,G5,A5,F5,G5,E5,C5,D5,B4};
int durMario[]    = {150,150,150,150,150,150,150,150,300,150,150,150,150,300,150,150,150,200,200,100,200,150,150,150,200,100,150,300,150,150,300};

int*  mel=nullptr; int* dur=nullptr;
int   melLen=0, melIdx=0;
unsigned long noteT=0;
bool  notePlay=false, melActive=false;

void startMusic(int* m, int* d, int len) {
  mel=m; dur=d; melLen=len; melIdx=0; noteT=0; notePlay=false; melActive=true;
}
void stopMusic() { noTone(BUZZER_PIN); melActive=false; }
void waitMusic() { while(melActive) { updateMusic(); delay(5); } }
void updateMusic() {
  if (!melActive) return;
  if (melIdx >= melLen) { stopMusic(); return; }
  unsigned long now = millis();
  if (!notePlay) {
    tone(BUZZER_PIN, mel[melIdx], dur[melIdx]*0.9);
    noteT=now; notePlay=true;
  } else if (now-noteT >= (unsigned long)dur[melIdx]) {
    noTone(BUZZER_PIN); melIdx++; notePlay=false;
  }
}

void stopMotors() {
  mL.stop(); mR.stop();
  mL.setCurrentPosition(0); mR.setCurrentPosition(0);
  mL.disableOutputs(); mR.disableOutputs();
}

void initMotors() {
  mL.setMaxSpeed(MOTOR_SPEED); mL.setAcceleration(MOTOR_ACCEL);
  mR.setMaxSpeed(MOTOR_SPEED); mR.setAcceleration(MOTOR_ACCEL);
  mL.enableOutputs(); mR.enableOutputs();
}

void avancerMM(float distMM) {
  if (abs(distMM) < 1.0) return;
  long steps = (long)(abs(distMM) * STEPS_PER_MM);
  int  dir   = (distMM > 0) ? 1 : -1;

  initMotors();
  mL.move(steps * dir);
  mR.move(steps * -dir);

  long stepsFaits = steps;
  unsigned long derniereSonde = 0;  
  while (mL.distanceToGo()!=0 || mR.distanceToGo()!=0) {

    if (millis() - derniereSonde >= 60) {
      float d = distanceMM();
      derniereSonde = millis();

      Serial.print("Distance : ");
      Serial.print(d / 10.0);
      Serial.println(" cm");

      if (d < 150.0 && d > 5.0) {  // obstacle < 15cm, valeur valide
        long restants = abs(mL.distanceToGo());
        stepsFaits = steps - restants;
        stopMotors(); stopMusic();
        lcdShow("OBSTACLE!", "J'attends...");
        showIcon(ICON_STOP);
        Serial.println("WARN:OBSTACLE");

        // Attend voie libre
        while (true) {
          float dd = distanceMM();
          Serial.print("Distance : ");
          Serial.print(dd / 10.0);
          Serial.println(" cm");
          if (dd > 200.0 || dd < 5.0) break;  // libre ou hors portée
          delay(200);
        }

        lcdShow("Voie libre!", "Je reprends...");
        showIcon(ICON_UP);
        Serial.println("INFO:REPRISE");
        delay(300);

        long reste = steps - stepsFaits;
        initMotors();
        startMusic(melImperial, durImperial, 18);
        mL.move(reste * dir);
        mR.move(reste * -dir);
        derniereSonde = millis();
      }
    }

    mL.run(); mR.run();
    updateMusic();
  }
  stopMotors();
  posX += distMM * sin(radians(cap));
  posY += distMM * cos(radians(cap));
}

void tournerDeg(float deg) {
  if (abs(deg) < 0.5) return;
  float arcMM = (abs(deg)/360.0) * 3.14159 * WHEELBASE_MM;
  long  steps  = (long)(arcMM * STEPS_PER_MM);
  int   dir    = (deg > 0) ? 1 : -1;
  initMotors();
  mL.move(steps * dir);
  mR.move(steps * dir);
  while (mL.distanceToGo()!=0 || mR.distanceToGo()!=0) {
    mL.run(); mR.run(); updateMusic();
  }
  stopMotors();
  cap = fmod(cap + deg + 360.0, 360.0);
}

// ─────────────────────────────────────────
//  TRAPPE
// ─────────────────────────────────────────
void ouvrirTrappe() {
  trappe.write(90);
  lcdShow("Trappe ouverte", "Recuperez colis");
  showIcon(ICON_OK);
  Serial.println("ACK:TRAPPE_OPEN");
}

void fermerTrappe() {
  trappe.write(0);
  lcdShow("Trappe fermee", "Pret");
  showIcon(ICON_WAIT);
  Serial.println("ACK:TRAPPE_CLOSE");
}

// ─────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────
void envoyerPosition() {
  char buf[48];
  snprintf(buf, sizeof(buf), "POS:%.1f,%.1f,%.1f", posX/10.0, posY/10.0, cap);
  Serial.println(buf);
}

void allerVers(float txCm, float tyCm) {
  float txMM = txCm * 10.0;
  float tyMM = tyCm * 10.0;
  float dx   = txMM - posX;
  float dy   = tyMM - posY;
  float dist = sqrt(dx*dx + dy*dy);

  if (dist < 5.0) { Serial.println("INFO:DEJA_EN_PLACE"); return; }

  float angleCible = degrees(atan2(dx, dy));
  if (angleCible < 0) angleCible += 360.0;
  float delta = angleCible - cap;
  while (delta >  180) delta -= 360;
  while (delta < -180) delta += 360;

  char buf[17];
  snprintf(buf, sizeof(buf), "->%dcm %dcm", (int)txCm, (int)tyCm);
  lcdShow(buf, "En route...");
  showIcon(ICON_UP);
  Serial.println("INFO:MOVING");

  // 1. Tourne vers la cible
  startMusic(melImperial, durImperial, 18);
  tournerDeg(delta);

  // 2. Avance vers la cible
  snprintf(buf, sizeof(buf), "%.1fcm", dist/10.0);
  lcdShow("En route...", buf);
  avancerMM(dist);
  stopMusic();

  envoyerPosition();
  Serial.println("ACK:ARRIVED");
  lcdShow("Arrive!", "Attente PIR...");
  showIcon(ICON_OK);

  // Attente PIR max 10s
  unsigned long t = millis();
  bool pir = false;
  while (millis()-t < 10000) {
    if (digitalRead(PIR_PIN)==HIGH) { pir=true; break; }
    delay(100);
  }

  if (pir) {
    Serial.println("ACK:PIR_DETECTED");
    startMusic(melMario, durMario, 31);
    ouvrirTrappe();
    waitMusic();
    delay(3000);
    fermerTrappe();
  } else {
    Serial.println("WARN:PIR_TIMEOUT");
    lcdShow("Pas de presence", "Fermeture auto");
  }

  // ── Retour base ──
  delay(1000);
  lcdShow("Retour base...", "");
  showIcon(ICON_UP);
  Serial.println("INFO:RETOUR_BASE");

  float retDist = sqrt(posX*posX + posY*posY);
  if (retDist > 5.0) {
    float retAngle = degrees(atan2(-posX, -posY));
    if (retAngle < 0) retAngle += 360.0;
    float retDelta = retAngle - cap;
    while (retDelta >  180) retDelta -= 360;
    while (retDelta < -180) retDelta += 360;
    if (abs(retDelta) > 179.0) retDelta = 180.0;

    startMusic(melImperial, durImperial, 18);
    tournerDeg(retDelta);
    avancerMM(retDist);
    stopMusic();
  }

  // Remet face au Nord
  float nordDelta = -cap;
  while (nordDelta >  180) nordDelta += 360;
  while (nordDelta < -180) nordDelta += 360;
  if (abs(nordDelta) > 2.0) tournerDeg(nordDelta);

  posX=0; posY=0; cap=0;
  lcdShow("Base atteinte!", "Pret");
  showIcon(ICON_WAIT);
  Serial.println("ACK:BASE_REACHED");
}

// ─────────────────────────────────────────
//  PROTOCOLE SÉRIE
//  GOTO:X,Y  (cm)  ex: GOTO:0,50
//  MOVE:D    (cm)  ex: MOVE:30
//  ROTATE:A  (deg) ex: ROTATE:90
//  OPEN / CLOSE / STATUS / RESET
// ─────────────────────────────────────────
String inputBuf = "";

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c=='\n'||c=='\r') {
      if (inputBuf.length()>0) { processCmd(inputBuf); inputBuf=""; }
    } else inputBuf += c;
  }
}

void processCmd(String cmd) {
  cmd.trim(); cmd.toUpperCase();
  Serial.print("CMD:"); Serial.println(cmd);

  if (cmd.startsWith("GOTO:")) {
    int comma = cmd.indexOf(',', 5);
    if (comma>0) {
      float tx = cmd.substring(5,comma).toFloat();
      float ty = cmd.substring(comma+1).toFloat();
      allerVers(tx, ty);
    } else Serial.println("ERR:FORMAT GOTO:X,Y en cm");
  }
  else if (cmd.startsWith("MOVE:"))   { avancerMM(cmd.substring(5).toFloat()*10.0); envoyerPosition(); Serial.println("ACK:MOVE_DONE"); }
  else if (cmd.startsWith("ROTATE:")) { tournerDeg(cmd.substring(7).toFloat()); Serial.println("ACK:ROTATE_DONE"); }
  else if (cmd=="OPEN")               { ouvrirTrappe(); }
  else if (cmd=="CLOSE")              { fermerTrappe(); }
  else if (cmd=="STATUS")             { envoyerPosition(); }
  else if (cmd=="RESET")              { posX=0;posY=0;cap=0; lcdShow("Reset OK","X:0 Y:0"); Serial.println("ACK:RESET"); }
  else Serial.println("ERR:COMMANDE_INCONNUE");
}

// ─────────────────────────────────────────
//  SETUP & LOOP
// ─────────────────────────────────────────
void setup() {
  Serial.begin(9600);

  lcd.begin(16,2);
  lcdShow("Robot Livreur", "Init...");

  lc.shutdown(0,false);
  lc.setIntensity(0,5);
  lc.clearDisplay(0);
  showIcon(ICON_WAIT);

  trappe.attach(SERVO_PIN);
  fermerTrappe();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(PIR_PIN,  INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  mL.setMaxSpeed(MOTOR_SPEED); mL.setAcceleration(MOTOR_ACCEL);
  mR.setMaxSpeed(MOTOR_SPEED); mR.setAcceleration(MOTOR_ACCEL);

  delay(1000);
  lcdShow("Pret!", "En attente cmd");
  Serial.println("READY");
}

void loop() {
  handleSerial();
  updateMusic();

  float d = distanceMM();

  // Affichage de la distance dans le Moniteur Série
  static unsigned long dernierEnvoi = 0;
  if (millis() - dernierEnvoi >= 500) {
    Serial.print("Distance : ");
    Serial.print(d / 10.0);
    Serial.println(" cm");
    dernierEnvoi = millis();
  }

  if (d < 100.0 && d > 5.0) {
    char buf[17];
    snprintf(buf, sizeof(buf), "Dist:%.0fmm", d);
    lcdShow("Obstacle proche!", buf);
    showIcon(ICON_STOP);
    Serial.println("WARN:OBSTACLE_NEAR");
    delay(500);
  }
  delay(50);
}
