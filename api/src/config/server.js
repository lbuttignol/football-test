const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// settings
app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json());

module.exports = app;