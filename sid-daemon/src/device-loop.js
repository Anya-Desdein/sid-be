
const Storage = require('../../sid-db-connector');
const storage = new Storage();

const latestSwitchedState = new Map();


const TapoConnector = require('../../hw-connector-tapo');


const tapoConnectorInstances = new Map();

async function getDeviceHandler(id, deviceConfig) {
  const { driver } = deviceConfig;
  if(driver === "hw-connector-tapo") {
    if(!tapoConnectorInstances.has(id)) {
      tapoConnectorInstances.set(id, new TapoConnector(deviceConfig));
    }
    return tapoConnectorInstances.get(id);
  }else{
    throw "Unknown driver: " + String(driver);
  }
}


async function deviceLoop(deviceConfig) {
  const devices = await storage.getDeviceList();
  devices.forEach(async ({id, currentState, overrideState}) => {
    const targetState = !!(overrideState !== null ? overrideState : currentState);
    if(!latestSwitchedState.has(id) || latestSwitchedState.get(id) !== targetState) {
      latestSwitchedState.set(id, targetState);
      if(deviceConfig.has(id)) {
        console.log("Switching device", id, targetState);
        const handler = await getDeviceHandler(id, deviceConfig.get(id));
        await handler.setState(targetState);
      }else{
        console.log("Device has no config!", id);
      }
    }
  })
}

module.exports = deviceLoop;
