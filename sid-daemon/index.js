
const Storage = require('../sid-db-connector');

const storage = new Storage();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function loop() {
  console.log("loop...")
}

async function main() {
  console.log(new Date(), "Daemon starting.")
  while(true) {
    try {
      await loop();
      await sleep(1000);
    }catch(e) {
      console.error(new Date(), "Main loop error", e);
      await sleep(5000);
    }
  }
}

main();
