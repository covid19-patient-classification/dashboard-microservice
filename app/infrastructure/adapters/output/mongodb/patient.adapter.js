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
        // const patients = []
        const currentDate = this.getCurrentDate();
        const weeklyVariation = 7
        const previousDate = this.getPreviousPeriod(currentDate, weeklyVariation);
        const filter = {
            created_at: {
                $gte: previousDate,
                $lt: currentDate
            }
        }

        const patients = await this.query(filter)
        return await this.getWeeklyRanking(previousDate, currentDate, patients);
    }

    async query(filter){
        // const result = await patientModel.find(filter)
        return await patientModel.find(filter)
    }


    async setupMongoDatabase() {
        await database.connect(config.dbUrl, {
            useNewUrlParser: true,
        });
    }
}

module.exports = PatientMongoDBAdapter;
