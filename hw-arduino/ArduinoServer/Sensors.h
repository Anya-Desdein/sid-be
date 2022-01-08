
#include <Arduino.h>
#include "DHT.h"
#define MAX_SENSOR_COUNT 8
#define SENSOR_TIMEOUT_S 20

struct SensorEntry {
  uint8_t localId;
  uint32_t lastUpdatedMillis;
  bool active;
  bool justUpdated;
  String name;
  float value;
};

class SensorManager {
private:
  SensorEntry sensors[MAX_SENSOR_COUNT] = {0};
  uint32_t baseId;
  
  void readTemperatureSensors(DHT* dht, size_t temperatureSensorIdx, size_t humiditySensorIdx);
  void writeSensor(String& response, const SensorEntry& entry, uint32_t currentTimeMillis);
public:
  SensorManager(uint32_t baseId);
  void handleSensorsResponse(String& response, uint32_t currentTimeMillis);
  void handleSensorsRefresh(uint32_t currentTimeMillis);
};
