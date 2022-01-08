
const axios = require('axios').default;

const latestReadingIds = new Map();

async function arduinoLoop() {
  const { data: sensors } = await axios.get('http://sid-sensor-hub.local/get-sensor-values');

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
