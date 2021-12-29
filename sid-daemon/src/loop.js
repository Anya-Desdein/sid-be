
const Storage = require('../../sid-db-connector');
const storage = new Storage();

async function loop() {
  // return (await storage.getSensorInfoAll()).map(({id}) => id);
  const from = new Date('2021-12-29T18:40:20.500Z');
  const to = null; //new Date('2021-12-29T18:42:20.500Z');
  console.log({from, to});
  return await storage.getSensorHistory('INVALID-SENS', from, to);
}

module.exports = loop;
