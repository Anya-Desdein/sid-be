
const Storage = require('../../sid-db-connector');
const storage = new Storage();

class PidController {
  constructor(deviceId, controllerData) {
    this.deviceId = deviceId;
    this.sensorId = controllerData.sensor;
    this.targetValue = controllerData.target;
    const { p, i, d, iMax, switchMargin, invertOutput, updateRate } = controllerData.pidParameters;
    if(typeof updateRate !== "number" || !(updateRate > 0)) {
      throw "updateRate must be defined";
    }
    this.pid = { p, i, d };
    this.iMax = iMax;
    this.switchMargin = switchMargin;
    this.invertOutput = invertOutput;

    this.previousError = null;
    this.errorSum = 0;

    this.currentOutputState = false;

    setInterval(() => this.loop().catch(e => console.log("PidController error:", e)), 1000 * updateRate);
  }

  async setOutputState(newState) {
    if(newState != this.currentOutputState) {
      this.currentOutputState = newState;
      await storage.setDeviceCurrentState(this.deviceId, newState);
      console.log(`PID switching device ${newState ? 'on' : 'off'}: ${this.deviceId} (sensor: ${this.sensorId})`);
    }
  }

  async loop() {
    const currentValue = await storage.getSensorValue(this.sensorId);

    const { previousError, pid, iMax, switchMargin, invertOutput, targetValue } = this;
    const error = (currentValue - targetValue);

    const p = error * pid.p;
    
    this.errorSum += error;
    if(this.errorSum > iMax) this.errorSum = iMax;
    if(this.errorSum < -iMax) this.errorSum = -iMax;

    const i = this.errorSum * pid.i;

    let d = 0;
    if(previousError != null) {
      const errorChange = error - previousError;
      d = -errorChange * pid.d;
    }


    const pidValue = p + i + d;
    
    console.log(`PID value P=${p.toPrecision(3)} I=${i.toPrecision(3)} D=${d.toPrecision(3)} PID=${pidValue.toPrecision(3)}`);

    if(pidValue < -switchMargin) {
      await this.setOutputState(!!invertOutput);
    }else if(pidValue > switchMargin) {
      await this.setOutputState(!invertOutput);
    }
  }
}


async function controllersInit(deviceConfig, controllerConfig) {
  const controllers = [...controllerConfig.values()];
  const instances = [];
  for(let controller of controllers) {
    if(controller.controllerData.controller === "pid") {
      instances.push(new PidController(controller.deviceId, controller.controllerData));
    }else{
      console.log("")
    }
  }
  console.log("Created controllers", instances);
}

module.exports = controllersInit;
