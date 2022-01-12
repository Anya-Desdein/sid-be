#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include "Sensors.h"

#define SERIAL_BAUD_RATE 115200
// #define SERIAL_BAUD_RATE 74880
#define MDNS_HOSTNAME "sid-sensor-hub"

const char* ssid = "Babel24";
const char* password = "sharkleCarrot749";

ESP8266WebServer server(80);
SensorManager* sm = nullptr;

const int led = 2;

void handleNotFound() {
  String message = "File Not Found\nPrzepraszam.\n";
  server.send(404, "text/plain", message);
}

void handleDebug() {
  digitalWrite(led, 0);
  String message = "Debug\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(200, "text/plain", message);
  digitalWrite(led, 1);
}

void setup() {
  pinMode(led, OUTPUT);
  digitalWrite(led, 1);
  Serial.begin(SERIAL_BAUD_RATE);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("");
  
  delay(2500);
  Serial.print("Connecting");

  //ESP.wdtDisable();
  //*((volatile uint32_t*) 0x60000900) &= ~(1); // Hardware WDT OFF
  
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Chip ID: ");
  Serial.println(ESP.getChipId());
  Serial.println("ACCESS BY UNAUTHORISED PERSONS NOT PERMITTED");
  
  sm = new SensorManager(ESP.getChipId());

  if (MDNS.begin(MDNS_HOSTNAME)) {
    Serial.println("MDNS responder started");
  }
  
  server.onNotFound(handleNotFound);
  server.on("/debug", handleDebug);
  server.on("/get-sensor-values", []() {
    digitalWrite(led, 0);
    String message = "";
    sm->handleSensorsResponse(message, millis());
    server.send(200, "application/json", message);
    digitalWrite(led, 1);
  });

  server.begin();
  Serial.println("HTTP server started");

  Serial.println("\nService available at:");
  Serial.print("  http://");
  Serial.print(WiFi.localIP());
  Serial.println("/get-sensor-values");
  Serial.println("  http://" MDNS_HOSTNAME ".local/get-sensor-values\n");
}

unsigned long lastSensorCheck = ~0;
void loop() {
  uint32_t currentTime = millis();
  if(lastSensorCheck > currentTime || currentTime > lastSensorCheck + 5000) {
    sm->handleSensorsRefresh(currentTime);
    lastSensorCheck = millis();
    String message = "sensor values: ";
    sm->handleSensorsResponse(message, currentTime);
    message.replace("\n", " ");
    Serial.println(message);
  }
  server.handleClient();
  MDNS.update();
}
