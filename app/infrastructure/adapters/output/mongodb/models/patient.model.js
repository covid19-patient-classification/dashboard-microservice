const patientEntity = require('../../../../../domain/patient.entity');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const patientSchema = new Schema(patientEntity);
const patientModel = mongoose.model('Patient', patientSchema);

module.exports = patientModel;
