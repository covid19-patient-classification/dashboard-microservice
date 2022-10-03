const database = require('mongoose');
const config = require('../../../resources/config');
const PatientOutputPort = require('../../../../application/ports/patient.port');
const patientModel = require('./models/patient.model');

database.Promise = global.Promise;

class PatientMongoDBAdapter extends PatientOutputPort {
    constructor() {
        super();
        this.setupMongoDatabase();
    }

    async list() {
        return await patientModel.find();
    }

    async setupMongoDatabase() {
        await database.connect(config.dbUrl, {
            useNewUrlParser: true,
        });
    }
}

module.exports = PatientMongoDBAdapter;
