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