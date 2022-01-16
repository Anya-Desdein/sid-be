// load .env file into process.env
require('dotenv').config();

const loop = require('./loop');

const sensorInit = require('./sensor-init');
const controllersInit = require('./controllers');

const blockingActionsLoopTimeoutSeconds = 5;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const deviceConfig = new Map();
const controllerConfig = new Map();

async function main() {
  // Init sensors and devices from app-config.json
  await sensorInit(deviceConfig, controllerConfig);
  await controllersInit(deviceConfig, controllerConfig);

  console.log(new Date(), "Daemon starting.")
  while(true) {
    try {
      const start = process.hrtime.bigint();
      const ret = await loop(deviceConfig);

      //console.log(new Date(), `Daemon loop took ${(process.hrtime.bigint() - start)/1000n} us`, ret);
      
      await sleep(500);
    }catch(e) {
      console.error(new Date(), "Main loop error:", e);
      await sleep(5000);
    }
  }
}

main();
