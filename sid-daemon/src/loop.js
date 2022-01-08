
const Storage = require('../../sid-db-connector');
const storage = new Storage();
const arduinoLoop = require('./arduino-loop');


const availableDeviceConnectors = {
  "tapo-plug": require('../../hw-connector-tapo'),
};

const plug = new availableDeviceConnectors['tapo-plug']({
  address: '',
  username: '',
  password: ''
});

async function loop(addBlockingAction) {
  await arduinoLoop();
  // return (await storage.getSensorInfoAll()).map(({id}) => id);
  // const from = new Date('2021-12-29T18:40:20.500Z');
  // const to = null; //new Date('2021-12-29T18:42:20.500Z');
  // console.log({from, to});
  // return await storage.getSensorHistory('INVALID-SENS', from, to);
  if(Math.random() < 0.2) {
    const targetState = Math.random() > 0.5;
    addBlockingAction(plug.setState(targetState));
    return targetState;
  }
}

module.exports = loop;
