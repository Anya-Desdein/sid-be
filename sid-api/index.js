const express = require('express');
const Storage = require('../sid-db-connector');

const app = express();
const port = 3030;

const storage = new Storage();

app.get('/api/get-sensor-list', async (req, res) => {
  const sensors = await storage.getSensorList();
  res.json({
    sensors,
  });
});

app.get('/api/get-device-list', async (req, res) => {
  const devices = await storage.getDeviceList();
  res.json({
    devices,
  });
});

app.post('/api/set-device-state/:sensorId/:state', async (req, res) => {
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
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});