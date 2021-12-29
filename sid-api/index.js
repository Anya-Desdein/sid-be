// load .env file into process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

// expressjs docs: https://expressjs.com/en/starter/hello-world.html
const app = express();

// CORS middleware to allow foreign requests
app.use(cors());

// Set up routes
routes(app);

// process.env: https://nodejs.org/api/process.html#processenv
const port = parseInt(process.env.HTTP_PORT, 10) || 3030;
const host = process.env.HTTP_HOST || 'localhost';

// Start server
app.listen(port, host, () => {
  console.log(`Example app listening at http://${host}:${port}`);
});
