
const Storage = require('../../sid-db-connector');
const storage = new Storage();

const fs = require("fs");
const path = require("path");

async function sensorInit(deviceConfig, controllerConfig) {

  const content = fs.readFileSync(path.resolve(__dirname, "..", "app-config.json"));

  const {
    sensors,
    outputDevices,
  } = JSON.parse(content);

  sensors.forEach(async ({id, type, displayName}) => {
    try {
      console.log("Sensor:", id);
      await storage.addSensor(id, type, displayName);
      console.log("Added new sensor:", id);
    }catch(e) {
      if(!e.alreadyExistsError) {
        console.error("Error while adding initital sensor:", id, e);
      }
    }
  });

  outputDevices.forEach(async ({id, displayName, deviceData, controllerId, controllerData}) => {
    try {
      console.log("Output device:", id);
      deviceConfig.set(id, deviceData);
      controllerConfig.set(id, {
        deviceId: id, 
        controllerId,
        controllerData
      });
      await storage.addOutputDevice(id, displayName, controllerId || null, controllerData || null, true);
      console.log("Added new output device:", id);
    }catch(e) {
      if(!e.alreadyExistsError) {
        console.error("Error while adding initital output device:", id, e);
      }
    }
  });
};

module.exports = sensorInit;
