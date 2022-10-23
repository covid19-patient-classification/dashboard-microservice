const patientEntity = require('../../../../../domain/patient.entity');
const mongoose = require('mongoose');
const socket = require('../../sockets/server.adapter').socket;

const Schema = mongoose.Schema;
const patientSchema = new Schema(patientEntity);
const patientModel = mongoose.model('Patient', patientSchema);

patientModel.watch().on('change', (change) => {
    if (change.operationType === 'insert') {
        const newPatient = change.fullDocument;
        socket.io.emit('patient', newPatient);
    }
});

module.exports = patientModel;
