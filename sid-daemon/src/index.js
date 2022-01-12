// load .env file into process.env
require('dotenv').config();

const loop = require('./loop');

const sensorInit = require('./sensor-init');

const blockingActionsLoopTimeoutSeconds = 5;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const deviceConfig = new Map();

async function main() {
  // Init sensors and devices from app-config.json
  await sensorInit(deviceConfig);

  console.log(new Date(), "Daemon starting.")
  while(true) {
    try {
      const start = process.hrtime.bigint();
      const blockingActionList = [];
      const ret = await loop(promise => blockingActionList.push(promise), deviceConfig);
      console.log(new Date(), `Daemon loop took ${(process.hrtime.bigint() - start)/1000n} us`, ret);
      
      await sleep(500);

      // Wait for all blocking actions to complete, or for timeout to elapse
      // https://stackoverflow.com/a/64820881
      await Promise.race([
        new Promise((_, r) => setTimeout(() => r(`Loop actions have not completed in ${blockingActionsLoopTimeoutSeconds} seconds!`), 1000 * blockingActionsLoopTimeoutSeconds)),
        Promise.all(blockingActionList)
      ]);
    }catch(e) {
      console.error(new Date(), "Main loop error:", e);
      await sleep(5000);
    }
  }
}

main();
