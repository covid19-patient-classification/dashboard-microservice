const express = require('express');
const patientsRouter = require('./patients.router');

function routerApi(app) {
    const router = express.Router();
    app.use('/api/v1', router);
    router.use('/patients', patientsRouter);
}

module.exports = routerApi;
