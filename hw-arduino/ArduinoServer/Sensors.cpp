#include "Sensors.h"

DHT dht_5(D5, DHT22);
DHT dht_6(D6, DHT22);

static void writeQuoted(String& target, const String& value, const String& suffix) {
  String escaped(value);
  escaped.replace("\"", "\\\"");
  target += "\"";
  target += escaped;
  target += "\"";
  target += suffix;
}


void SensorManager::writeSensor(String& response, const SensorEntry& entry, uint32_t currentTimeMillis) {
  uint32_t timeAgo = currentTimeMillis - entry.lastUpdatedMillis;
  String id(baseId);
  id += "-";
  id += entry.localId;
  writeQuoted(response, "id", ": ");
  writeQuoted(response, id, ", ");
  writeQuoted(response, "name", ": ");
  writeQuoted(response, String(entry.name), ", ");
  writeQuoted(response, "value", ": ");
  response += entry.value;
  response += ", ";
  writeQuoted(response, "lastUpdateAgo", ": ");
  response += timeAgo / 1000.0f;
}

SensorManager::SensorManager(uint32_t baseId) : baseId(baseId) {
  // singleton assumed (1 instance)
  dht_5.begin();
  dht_6.begin();

  for(size_t i = 0; i < MAX_SENSOR_COUNT; i++) {
    sensors[i] = SensorEntry {
      i + 1, ~0, false, false, "", 0.0f,
    };
  }
}

void SensorManager::readTemperatureSensors(DHT* dht, size_t temperatureSensorIdx, size_t humiditySensorIdx) {
  float temperature = dht->readTemperature();
  if(!isnan(temperature)) {
    sensors[temperatureSensorIdx].justUpdated = true;
    sensors[temperatureSensorIdx].name = "temperature";
    sensors[temperatureSensorIdx].value = temperature;
  }
  float humidity = dht->readHumidity();
  if(!isnan(humidity)) {
    sensors[humiditySensorIdx].justUpdated = true;
    sensors[humiditySensorIdx].name = "humidity";
    sensors[humiditySensorIdx].value = humidity;
  }
}

void SensorManager::handleSensorsResponse(String& response, uint32_t currentTimeMillis) {
  response += "[\n";

  bool first = true;
  for(size_t i = 0; i < MAX_SENSOR_COUNT; i++) {
    if(sensors[i].active) {
      if(first) {
        first = false;
      }else{
        response += ",\n";
      }
      response += "{";
      writeSensor(response, sensors[i], currentTimeMillis);
      response += "}";
    }
  }

  response += "\n]";
}


void SensorManager::handleSensorsRefresh(uint32_t currentTimeMillis) {
  for(size_t i = 0; i < MAX_SENSOR_COUNT; i++) {
    sensors[i].justUpdated = false;
  }
  
  readTemperatureSensors(&dht_5, 0, 1);
  readTemperatureSensors(&dht_6, 2, 3);
  
  for(size_t i = 0; i < MAX_SENSOR_COUNT; i++) {
    SensorEntry* s = &sensors[i];
    if(s->justUpdated) {
      s->lastUpdatedMillis = currentTimeMillis;
      s->active = true;
    }else if(s->active) {
      uint32_t timeAgo = currentTimeMillis - s->lastUpdatedMillis;
      if(timeAgo > 1000 * SENSOR_TIMEOUT_S) {
        s->active = false;
      }
    }
  }
}
