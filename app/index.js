const config = require('./infrastructure/resources/config');
const express = require('express');
const routerApi = require('./infrastructure/adapters/input/api/v1/routes');

const app = express();

// Json Middelware
app.use(express.json());

routerApi(app);

app.listen(config.port, () => {
    console.log('Dasboard microservice listening on port ' + config.port);
});
