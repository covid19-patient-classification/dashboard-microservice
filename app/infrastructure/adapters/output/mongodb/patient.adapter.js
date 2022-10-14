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

    setGeneralFilter(startDate, endDate, covid19Severity) {
        const filter = {
            created_at: {
                $gte: startDate,
                $lt: endDate,
            },
        };

        if (covid19Severity) filter.covid19_severity = covid19Severity;

        return filter;
    }

    async getLastSevenDaysData(previousDate, currentDate, covid19Severity) {
        const filter = this.setGeneralFilter(
            previousDate,
            currentDate,
            covid19Severity
        );

        return await this.query(
            filter,
            { created_at: 1 },
            'created_at covid19_severity'
        );
    }

    async getFifteenData(previousDate, covid19Severity) {
        const weeklyVariation = 7;
        const fifteenDate = this.getPreviousPeriod(
            previousDate,
            weeklyVariation
        );
        const filter = this.setGeneralFilter(
            fifteenDate,
            previousDate,
            covid19Severity
        );

        return await this.query(
            filter,
            { created_at: 1 },
            'created_at covid19_severity'
        );
    }

    async getAnnualData(currentDate) {
        const filter = this.setGeneralFilter(
            this.getFirstDateOfYear(),
            currentDate
        );
        return await this.query(
            filter,
            { created_at: 1 },
            'created_at covid19_severity'
        );
    }

    async list() {
        const { previousDate, currentDate } = this.getLastSevenDates();

        const weeklyData = await this.getLastSevenDaysData(
            previousDate,
            currentDate
        );

        // Data from 15 days ago
        const fifteenData = await this.getFifteenData(previousDate);

        // Data all year
        const annualData = await this.getAnnualData(currentDate);

        // Data from previous year
        const totalPatientsOfPreviousYear = await this.count(
            this.setGeneralFilter(
                this.getFirstDateOfPreviousYear(),
                this.getLastDateOfPreviousYear()
            )
        );

        // Total ranking
        const totalModeratePatients = await this.count({
            covid19_severity: this.severityKeywords.moderate.shortLabel,
        });
        const totalSeriusPatients = await this.count({
            covid19_severity: this.severityKeywords.serius.shortLabel,
        });
        const totalCriticalPatients = await this.count({
            covid19_severity: this.severityKeywords.critical.shortLabel,
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
            totalCriticalPatients,
        };

        return await this.setInitialData(data);
    }

    async filterPatient(queryParams) {
        const covid19Severity = queryParams.covid19Severity;
        if (covid19Severity) {
            if (queryParams.dateRange) {
                const dateRange = queryParams.dateRange.toLowerCase();
                if (dateRange === 'lastsevendays') {
                    const { previousDate, currentDate } =
                        this.getLastSevenDates();
                    const weeklyData = await this.getLastSevenDaysData(
                        previousDate,
                        currentDate,
                        this.severityKeywords[covid19Severity].shortLabel
                    );
                    const fifteenData = await this.getFifteenData(
                        previousDate,
                        this.severityKeywords[covid19Severity].shortLabel
                    );
                    const data = {
                        startDate: previousDate,
                        endDate: currentDate,
                        startData: weeklyData,
                        endData: fifteenData,
                        severity: covid19Severity,
                        dateRange: queryParams.dateRange

                    };
                    return await this.setCardRanking(data);
                }
                if (dateRange === 'lastweek') {
                    console.log(2, queryParams);
                }
                if (dateRange === 'lastmonth') {
                    console.log(3, queryParams);
                }
            } else {
                console.log(4, queryParams);
            }
        } else {
            console.log(5, queryParams);
        }
    }

    async query(filter, sorter, selecter) {
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
