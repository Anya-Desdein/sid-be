const { Pool } = require('pg');

// Uses environment variables https://www.postgresql.org/docs/9.1/libpq-envars.html

class Storage {
  constructor() {
    this.pool = new Pool();
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

  async getDeviceList() {
    const { rows } = await this.pool.query(
      `SELECT "id", "displayName", "currentState", "overrideState" FROM output_devices`
    );
    return rows;
  }

  async setDeviceStatus(sensorId, parsedState) {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM output_devices WHERE "id" = $1`,
      [ sensorId ]
    );
    if(!rows || !rows.length) {
      throw new Error("Invalid sensorId");
    }
    await this.pool.query(
      `UPDATE output_devices SET "overrideState" = $2 WHERE "id" = $1`,
      [ sensorId, parsedState ]
    );
  }

}

module.exports = Storage;