const config = require('./infrastructure/resources/config');
const socket = require('./infrastructure/adapters/output/sockets/server.adapter');
const routerApi = require('./infrastructure/adapters/input/api/v1/routes');
const express = require('express');
const cors = require('cors');

const app = express();
const server = require('http').Server(app);

app.use(cors());
app.use(express.json()); // Json Middelware
socket.connect(server);
routerApi(app);

server.listen(config.port, () => {
    console.log('Dasboard microservice listening on port ' + config.port);
});
