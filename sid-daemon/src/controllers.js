
const Storage = require('../../sid-db-connector');
const storage = new Storage();

class PidController {
  constructor(deviceId, controllerData) {
    this.deviceId = deviceId;
    this.sensorId = controllerData.sensor;
    this.targetValue = controllerData.target;
    const { p, i, d, iMax, iUpdateRate, switchMargin, invertOutput, updateRate } = controllerData.pidParameters;
    if(typeof updateRate !== "number" || !(updateRate > 0)) {
      throw "updateRate must be defined";
    }
    this.pid = { p, i, d };
    this.iMax = iMax;
    this.iUpdateRate = iUpdateRate;
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

  // https://en.wikipedia.org/wiki/PID_controller#Pseudocode
  /*
  
   error := setpoint − measured_value
   proportional := error;
   integral := integral + error × dt
   derivative := (error − previous_error) / dt
   output := Kp × proportional + Ki × integral + Kd × derivative
   previous_error := error
   */
  async loop() {
    const currentValue = await storage.getSensorValue(this.sensorId);
    if(currentValue == null) {
      throw "Cannot get sensor value for " + this.sensorId;
    }

    const { previousError, pid, iMax, iUpdateRate, switchMargin, invertOutput, targetValue } = this;
    const error = targetValue - currentValue;

    const p = error;
    
    this.errorSum += error * iUpdateRate;
    if(this.errorSum > iMax) this.errorSum = iMax;
    if(this.errorSum < -iMax) this.errorSum = -iMax;

    const i = this.errorSum;

    let d = 0;
    if(previousError != null) {
      d = error - previousError;
    }

    const pidValue = p * pid.p + i * pid.i + d * pid.d;

    this.previousError = error;
    
    console.log(`PID target=${targetValue} currentValue=${currentValue} value P=${p.toPrecision(3)} I=${i.toPrecision(3)} D=${d.toPrecision(3)} PID=${pidValue.toPrecision(3)}`);

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
