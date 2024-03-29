const { Pool } = require('pg');

// Uses environment variables https://www.postgresql.org/docs/9.1/libpq-envars.html

// Postresql requires fields with upper case names to be quoted e.g. "latestValue"

class Storage {
  constructor() {
    this.pool = new Pool();
  }

  validateSensorIdFormat(sensorId) {
    if(typeof sensorId !== "string" || sensorId.length === 0 || sensorId.length > 64) {
      throw new Error("Invalid sensor ID format: " + String(sensorId))
    }
  }

  async checkSensorIdExists(sensorId, client = null) {
    const { rows } = await (client ? client : this.pool).query(
      `SELECT 1 FROM sensors WHERE "id" = $1`,
      [ sensorId ]
    );
    return rows && rows.length;
  }

  async checkDeviceIdExists(deviceId, client = null) {
    const { rows } = await (client ? client : this.pool).query(
      `SELECT 1 FROM output_devices WHERE "id" = $1`,
      [ deviceId ]
    );
    return rows && rows.length;
  }

  async getSensorInfoAll() {
    const { rows } = await this.pool.query(
      `SELECT "id", "type", "displayName", "latestValue", "latestReadingDate" FROM sensors`
    );
    return rows;
  }

  async getSensorInfo(idList) {
    if(!idList || !idList.length)
      return await this.getSensorInfoAll();

    const { rows } = await this.pool.query(
      `SELECT "id", "type", "displayName", "latestValue", "latestReadingDate" FROM sensors WHERE id = ANY($1::character varying[])`,
      [ idList ]
    );
    return rows;
  }

  async getSensorValue(id) {
    if(typeof id !== "string" || !id) {
      throw "getSensorId requires a single ID";
    }

    const { rows } = await this.pool.query(
      `SELECT "latestValue" FROM sensors WHERE id = $1`,
      [ id ]
    );

    if(!rows || !rows.length) return null;
    return rows[0].latestValue;
  }

  async addSensor(sensorId, type, displayName) {
    this.validateSensorIdFormat(sensorId);

    if(await this.checkSensorIdExists(sensorId)) {
      const err = new Error('Sensor already exists: ' + sensorId);
      err.alreadyExistsError = true;
      throw err;
    }
    
    const { rowCount: insertRowCount } = await this.pool.query(
      `INSERT INTO sensors(id, type, "displayName") VALUES ($1, $2, $3)`,
      [ sensorId, type, displayName ]
    );

    if(insertRowCount === 0) {
      throw new Error("Could not create sensor with id: " + sensorId);
    }
  }

  async addOutputDevice(deviceId, displayName, controllerId = null, controllerData = null, allowOverwrite = false) {
    this.validateSensorIdFormat(deviceId);

    let overwrite = false;
    if(await this.checkDeviceIdExists(deviceId)) {
      if(allowOverwrite) {
        overwrite = true;
      }else{
        const err = new Error('Device already exists: ' + deviceId);
        err.alreadyExistsError = true;
        throw err;
      }
    }

    if(overwrite) {
      const [ oldEntry ] = await this.getDeviceList([deviceId]);
      if(!oldEntry) throw 'Old entry does not exist';

      const controllerIdChanged = oldEntry.controllerId !== controllerId;

      const { rowCount } = await this.pool.query(
        `UPDATE output_devices 
        SET "displayName" = $2, "controllerId" = $3, "controllerData" = $4 
        WHERE "id" = $1`,
        [ 
          deviceId, 
          displayName, 
          controllerId, 
          // update controllerData only if controller id changes
          controllerIdChanged ? controllerData : oldEntry.controllerData 
        ]
      );
  
      if(rowCount === 0) {
        throw new Error("Could not update sensor with id: " + deviceId);
      }
    }else{
      const { rowCount } = await this.pool.query(
        `INSERT INTO output_devices(id, "displayName", "controllerId", "controllerData") VALUES ($1, $2, $3, $4)`,
        [ deviceId, displayName, controllerId, controllerData ]
      );
  
      if(rowCount === 0) {
        throw new Error("Could not create sensor with id: " + deviceId);
      }
    }
  }


  async updateOutputDeviceControllerDate(deviceId, controllerData = null) {
    this.validateSensorIdFormat(deviceId);

    if(!await this.checkDeviceIdExists(deviceId)) {
      throw new Error('Device does not exist: ' + deviceId);
    }

    const { rowCount } = await this.pool.query(
      `UPDATE output_devices SET "controllerData" = $2 WHERE "id" = $1`,
      [ deviceId, controllerData ]
    );

    if(rowCount === 0) {
      throw new Error("Could not update sensor with id: " + deviceId);
    }
  }


  async addSensorValue(sensorId, value, addHistoryRecord = false) {
    this.validateSensorIdFormat(sensorId);
    
    if(typeof value !== "number" || isNaN(value)) {
      throw new Error("Invalid sensor value for sensor " + sensorId);
    }

    // https://node-postgres.com/features/transactions
    // To use transactions, a single client must be used as transactions
    // are scoped to a client.
    
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      // Passing client to prevent possible deadlock when all pool connections are acquired
      // but validateSensorIdExist method would require another connection before any other 
      // can be released.
      if(!await this.checkSensorIdExists(sensorId, client)) {
        throw new Error("Given sensorId does not exist in database: " + String(sensorId));
      }

      const readingDate = new Date();

      const { rowCount: updateRowCount } = await client.query(
        `UPDATE sensors SET "latestValue" = $2, "latestReadingDate" = $3 WHERE "id" = $1`,
        [ sensorId, value, readingDate ]
      );

      if(updateRowCount === 0) {
        throw new Error("Could not update sensor value for sensor: " + sensorId);
      }

      if(addHistoryRecord) {
        const { rowCount: insertRowCount } = await client.query(
          `INSERT INTO sensor_history("sensorId", value, "readingDate") VALUES ($1, $2, $3)`,
          [ sensorId, value, readingDate ]
        );
        
        if(insertRowCount === 0) {
          throw new Error("Could not insert sensor history value for sensor: " + sensorId);
        }
      }

      await client.query('COMMIT');
    } catch(e) {
      // In case of any error, roll back the transaction to avoid partial updates.
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getSensorHistory(sensorId, from = null, to = null) {
    if(to && from && from > to) {
      throw '"from" must be before "to"';
    }

    let query, args;

    if(!to && !from) {
      query = `SELECT "value", "readingDate" FROM sensor_history WHERE "sensorId" = $1 ORDER BY "readingDate" DESC`;
      args = [ sensorId ];

    }else if(!to && from) {
      query = `SELECT "value", "readingDate" FROM sensor_history WHERE "sensorId" = $1 AND "readingDate" > $2 ORDER BY "readingDate" DESC`;
      args = [ sensorId, from ];

    }else if(to && !from) {
      query = `SELECT "value", "readingDate" FROM sensor_history WHERE "sensorId" = $1 AND "readingDate" < $2 ORDER BY "readingDate" DESC`;
      args = [ sensorId, to ];

    }else if(to && from) {
      query = `SELECT "value", "readingDate" FROM sensor_history WHERE "sensorId" = $1 AND "readingDate" > $2 AND "readingDate" < $3 ORDER BY "readingDate" DESC`;
      args = [ sensorId, from, to ];

    }else{
      throw 'unexpected state';
    }

    const { rows } = await this.pool.query(query, args);
    return rows;
  }

  async getDeviceList(idList) {
    const ignoreIdList = !idList || !idList.length;

    const { rows } = await this.pool.query(
      `SELECT "id", "controllerId", "controllerData", "displayName", "currentState", "overrideState" FROM output_devices
        WHERE id = ANY($1::character varying[]) OR $2 IS TRUE`,
      [ idList, ignoreIdList ]
    );
    return rows;
  }
  
  async setDeviceStatus(sensorId, parsedState) {
    if(!await this.checkDeviceIdExists(sensorId)) {
      throw new Error("Given deviceId does not exist in database: " + String(sensorId));
    }
    await this.pool.query(
      `UPDATE output_devices SET "overrideState" = $2 WHERE "id" = $1`,
      [ sensorId, parsedState ]
    );
  }

  async setDeviceCurrentState(sensorId, parsedState) {
    if(!await this.checkDeviceIdExists(sensorId)) {
      throw new Error("Given deviceId does not exist in database: " + String(sensorId));
    }
    await this.pool.query(
      `UPDATE output_devices SET "currentState" = $2 WHERE "id" = $1`,
      [ sensorId, parsedState ]
    );
  }

}

module.exports = Storage;