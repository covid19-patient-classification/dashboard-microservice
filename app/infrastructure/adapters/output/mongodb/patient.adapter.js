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
        const currentDate = this.getCurrentDate();
        const weeklyVariation = 7
        const previousDate = this.getPreviousPeriod(currentDate, weeklyVariation);
        const currentWeekfilter = {
            created_at: {
                $gte: previousDate,
                $lt: currentDate
            }
        }

        const weeklyData = await this.query(currentWeekfilter);

        // Data from 15 days ago
        const fifteenDate = this.getPreviousPeriod(previousDate, weeklyVariation);
        const fitteenWeekfilter = {
            created_at: {
                $gte: fifteenDate,
                $lt: previousDate
            }
        }
        const fifteenData = await this.query(fitteenWeekfilter);
        return await this.getInitialData(previousDate, currentDate, weeklyData, fifteenData);
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
