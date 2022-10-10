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
        const weeklyVariation = 7;
        const previousDate = this.getPreviousPeriod(
            currentDate,
            weeklyVariation
        );

        const weeklyData = await this.query({
            created_at: {
                $gte: previousDate,
                $lt: currentDate,
            },
        });

        // Data from 15 days ago
        const fifteenDate = this.getPreviousPeriod(
            previousDate,
            weeklyVariation
        );
        const fifteenData = await this.query({
            created_at: {
                $gte: fifteenDate,
                $lt: previousDate,
            },
        });

        // Summary data
        const summaryData = await this.query({}, { created_at: -1 });

        return await this.getInitialData(
            previousDate,
            currentDate,
            weeklyData,
            fifteenData,
            summaryData
        );
    }

    async query(filter, sorter) {
        // const result = await patientModel.find(filter)
        return await patientModel.find(filter).sort(sorter);
    }

    async setupMongoDatabase() {
        database.connect(config.dbUrl, {
            useNewUrlParser: true,
        });
    }
}

module.exports = PatientMongoDBAdapter;
