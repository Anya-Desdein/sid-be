
const axios = require('axios').default;

const latestReadingIds = new Map();

const sensorHubEndpointUrl = process.env.SENSOR_HUB_URL;
if(!sensorHubEndpointUrl) throw 'SENSOR_HUB_URL environment variable not set!';

async function arduinoLoop() {
  const { data: sensors } = await axios.get(sensorHubEndpointUrl);

  sensors.forEach(sensor => {
    // mark already collected readings
    if(latestReadingIds.has(sensor.id) && latestReadingIds.get(sensor.id) === sensor.readingId) {
      sensor.duplicateReading = true;
    }else{
      latestReadingIds.set(sensor.id, sensor.readingId);
    }
  });

  console.log(sensors);
}

module.exports = arduinoLoop;
