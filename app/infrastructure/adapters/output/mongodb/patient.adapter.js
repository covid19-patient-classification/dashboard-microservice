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

        const weeklyData = await this.query(
            {
                created_at: {
                    $gte: previousDate,
                    $lt: currentDate,
                },
            },
            { created_at: 1 },
            'created_at covid19_severity'
        );

        // Data from 15 days ago
        const fifteenDate = this.getPreviousPeriod(
            previousDate,
            weeklyVariation
        );
        const fifteenData = await this.query(
            {
                created_at: {
                    $gte: fifteenDate,
                    $lt: previousDate,
                },
            },
            { created_at: 1 },
            'created_at covid19_severity'
        );

        // Data all year
        const annualData = await this.query(
            {
                created_at: {
                    $gte: this.getFirstDateOfYear(),
                    $lt: currentDate,
                },
            },
            { created_at: 1 },
            'created_at covid19_severity'
        );

        // Data from previous year
        const totalPatientsOfPreviousYear = await this.count({
            created_at: {
                $gte: this.getFirstDateOfPreviousYear(),
                $lt: this.getLastDateOfPreviousYear(),
            },
        });

        // Total ranking
        const totalModeratePatients = await this.count({
            covid19_severity: 'Moderado',
        });
        const totalSeriusPatients = await this.count({
            covid19_severity: 'Grave',
        });
        const totalCriticalPatients = await this.count({
            covid19_severity: 'Crítico',
        });

        // Summary data
        const summaryData = await this.query({}, { created_at: -1 });

        const data = {
            previousDate,
            currentDate,
            weeklyData,
            fifteenData,
            summaryData,
            annualData,
            totalPatientsOfPreviousYear,
            totalModeratePatients,
            totalSeriusPatients,
            totalCriticalPatients
        };

        return await this.setInitialData(data);
    }

    async query(filter, sorter, selecter) {
        // const result = await patientModel.find(filter)
        return await patientModel.find(filter).sort(sorter).select(selecter);
    }

    async count(filter) {
        return await patientModel.find(filter).count();
    }

    async setupMongoDatabase() {
        database.connect(config.dbUrl, {
            useNewUrlParser: true,
        });
    }
}

module.exports = PatientMongoDBAdapter;
