// load .env file into process.env
require('dotenv').config();

const loop = require('./loop');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(new Date(), "Daemon starting.")
  while(true) {
    try {
      const start = process.hrtime.bigint();
      const ret = await loop();
      console.log(new Date(), `Daemon loop took ${(process.hrtime.bigint() - start)/1000n} us`, ret);
      await sleep(2500);
    }catch(e) {
      console.error(new Date(), "Main loop error", e);
      await sleep(10000);
    }
  }
}

main();
