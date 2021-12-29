const Storage = require('../../sid-db-connector');
const storage = new Storage();

function errorsHandled(fn) {
  // solution to error handling in async functions
  // https://stackoverflow.com/questions/55887918/express-js-async-router-and-error-handling
  return async (req, res) => {
    try {
      await fn(req, res);
    }catch(e) {
      res.status(500).json({ 
        // convert error of any type to string
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/String 
        error: String(e)
      });
    }
  }
}

module.exports = app => {
  app.get('/api/get-sensor-list/:sensorIds?', errorsHandled(async (req, res) => {
    const { sensorIds } = req.params;
    const sensorIdsArray = sensorIds ? sensorIds.split(",") : [];
    const sensors = await storage.getSensorInfo(sensorIdsArray);
    res.json({
      sensors,
    });
  }));

  app.get('/api/get-sensor-history/:sensorId', errorsHandled(async (req, res) => {
    const { sensorId } = req.params;
    const { from, to } = req.query;

    if(!sensorId) {
      throw 'sensorId required';
    }

    let parsedFrom, parsedTo;

    if(from) {
      if(typeof from === "string") {
        parsedFrom = new Date(from);
      }
      if(!parsedFrom || isNaN(parsedFrom.getTime())) {
        throw new Error('"from" must be a valid date');
      }
    }

    if(to) {
      if(typeof to === "string") {
        parsedTo = new Date(to);
      }
      if(!parsedTo || isNaN(parsedTo.getTime())) {
        throw new Error('"to" must be a valid date');
      }
    }

    const data = await storage.getSensorHistory(sensorId, parsedFrom, parsedTo);

    res.json({
      sensorId,
      from: parsedFrom,
      to: parsedTo,
      data,
    })
  }));

  app.get('/api/get-device-list', errorsHandled(async (req, res) => {
    const devices = await storage.getDeviceList();
    res.json({
      devices,
    });
  }));

  app.post('/api/set-device-state/:sensorId/:state', errorsHandled(async (req, res) => {
    const { sensorId, state } = req.params;
    let parsedState;
    if(state === "true") parsedState = true;
    else if(state === "false") parsedState = false;
    else if(state === "null") parsedState = null;
    else {
      return res.json({ error: 'Invalid "state" parameter' });
    }

    try {
      await storage.setDeviceStatus(sensorId, parsedState);
      res.json({ ok: true });
    }catch(e) {
      res.json({ error: String(e) });
    }
  }));
};
