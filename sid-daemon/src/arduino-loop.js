
const axios = require('axios').default;
const Storage = require('../../sid-db-connector');
const storage = new Storage();

const latestReadingIds = new Map();
const latestHistoryTimes = new Map();

const sensorHubEndpointUrl = process.env.SENSOR_HUB_URL;
if(!sensorHubEndpointUrl) throw 'SENSOR_HUB_URL environment variable not set!';


async function arduinoLoop() {
  let sensors;
  // todo: cleanup
  try {
    const { data } = await axios.get(sensorHubEndpointUrl);
    sensors = data;
  }catch(e) {
    //retry
    try {
      await new Promise(r => setTimeout(r, 500));
      const { data } = await axios.get(sensorHubEndpointUrl);
      sensors = data;
    }catch(e) {
      //retry
      try {
        await new Promise(r => setTimeout(r, 500));
        const { data } = await axios.get(sensorHubEndpointUrl);
        sensors = data;
      }catch(e) {
        console.log("cannot get sensor data after 3 attempts.", e);
      }
    }
  }
  const currentMinute = Math.floor((new Date()).getTime()/1000/60);

  sensors.forEach(sensor => {
    // mark already collected readings
    if(latestReadingIds.has(sensor.id) && latestReadingIds.get(sensor.id) === sensor.readingId) {
      sensor.duplicateReading = true;
    }
    // mark readings which had history entry for this minute
    if(latestHistoryTimes.has(sensor.id) && latestHistoryTimes.get(sensor.id) === currentMinute) {
      sensor.historyAlreadySubmitted = true;
    }
  });

  sensors
    .filter(sensor => !sensor.duplicateReading)
    .forEach(sensor => {
      storage.addSensorValue(sensor.id, sensor.value, !sensor.historyAlreadySubmitted);
      latestReadingIds.set(sensor.id, sensor.readingId);
      if(!sensor.historyAlreadySubmitted) {
        latestHistoryTimes.set(sensor.id, currentMinute);
      }
    });

  // console.log(sensors);
}

module.exports = arduinoLoop;
