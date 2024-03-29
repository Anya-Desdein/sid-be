
const arduinoLoop = require('./arduino-loop');
const deviceLoop = require('./device-loop');


let lastArduinoLoopDate = new Date(1);

async function loop(deviceConfig) {
  const currentDate = new Date();
  
  if(Math.abs((currentDate - lastArduinoLoopDate)/1000) > 5) {
    arduinoLoop();
    lastArduinoLoopDate = currentDate;
  }

  await deviceLoop(deviceConfig);
  // return (await storage.getSensorInfoAll()).map(({id}) => id);
  // const from = new Date('2021-12-29T18:40:20.500Z');
  // const to = null; //new Date('2021-12-29T18:42:20.500Z');
  // console.log({from, to});
  // return await storage.getSensorHistory('INVALID-SENS', from, to);
}

module.exports = loop;
