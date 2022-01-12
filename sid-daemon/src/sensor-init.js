
const Storage = require('../../sid-db-connector');
const storage = new Storage();

const fs = require("fs");
const path = require("path");

async function sensorInit(deviceConfig) {

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

  outputDevices.forEach(async ({id, displayName, deviceData}) => {
    try {
      console.log("Output device:", id);
      deviceConfig.set(id, deviceData);
      await storage.addOutputDevice(id, displayName);
      console.log("Added new output device:", id);
    }catch(e) {
      if(!e.alreadyExistsError) {
        console.error("Error while adding initital output device:", id, e);
      }
    }
  });
};

module.exports = sensorInit;
