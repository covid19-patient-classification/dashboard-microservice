const database = require('mongoose');
const config = require('../../../resources/config');
const PatientOutputPort = require('../../../../application/ports/patient.port');
const patientModel = require('./models/patient.model');

database.Promise = global.Promise;

class PatientMongoDBAdapter extends PatientOutputPort {
    constructor() {
        super();
        this.setupMongoDatabase();
        this.sevenDaysVariation = 7;
        this.thirtyDaysVariation = 30;
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

    async filterPatient(startDate, endDate, covid19Severity) {
        const filter = this.setGeneralFilter(
            startDate,
            endDate,
            covid19Severity
        );

        return await this.query(
            filter,
            { created_at: 1 },
            'created_at covid19_severity'
        );
    }

    async getLastSevenDaysData(covid19Severity) {
        const { previousDate, currentDate } = this.getLastSevenDates();
        const lastSevenDaysData = await this.filterPatient(
            previousDate,
            currentDate,
            covid19Severity
        );
        const fifteenDate = this.getPreviousPeriod(
            previousDate,
            this.sevenDaysVariation
        );
        const previousWeekData = await this.filterPatient(
            fifteenDate,
            previousDate,
            covid19Severity
        );
        return {
            lastSevenDaysData,
            previousWeekData,
            currentDate,
            previousDate,
        };
    }

    async getAnnualData(currentDate) {
        const firstDayYear = this.getFirstDateOfYear();
        const annualData = await this.filterPatient(firstDayYear, currentDate);
        const totalPatientsOfPreviousYear = await this.count(
            this.setGeneralFilter(
                this.getFirstDateOfPreviousYear(),
                this.getLastDateOfPreviousYear()
            )
        );

        return { annualData, totalPatientsOfPreviousYear };
    }

    async list() {
        // Data of last seven days
        const {
            lastSevenDaysData,
            previousWeekData,
            currentDate,
            previousDate,
        } = await this.getLastSevenDaysData();

        // Data all year
        const { annualData, totalPatientsOfPreviousYear } =
            await this.getAnnualData(currentDate);

        // Total ranking
        const totalModeratePatients = await this.count({
            covid19_severity: this.covid19Severities.moderate.shortLabel,
        });
        const totalSeriusPatients = await this.count({
            covid19_severity: this.covid19Severities.serius.shortLabel,
        });
        const totalCriticalPatients = await this.count({
            covid19_severity: this.covid19Severities.critical.shortLabel,
        });

        // Summary data
        const summaryData = await this.query({}, { created_at: -1 });

        return await this.setInitialData({
            starDate: previousDate,
            endDate: currentDate,
            weeklyData: lastSevenDaysData,
            fifteenData: previousWeekData,
            annualData: annualData,
            totalPatientsOfPreviousYear: totalPatientsOfPreviousYear,
            totalRanking: {
                moderate: totalModeratePatients,
                serius: totalSeriusPatients,
                critical: totalCriticalPatients,
            },
            summaryData: summaryData,
        });
    }

    async filterDataByParams(queryParams) {
        const severity = queryParams.covid19Severity;
        if (severity) {
            if (queryParams.dateRange) {
                const dateRange = queryParams.dateRange.toLowerCase();
                if (dateRange === 'lastsevendays') {
                    const { previousDate, currentDate } =
                        this.getLastSevenDates();
                    const weeklyData = await this.getLastSevenDaysData(
                        previousDate,
                        currentDate,
                        this.covid19Severities[severity].shortLabel
                    );
                    const fifteenData = await this.getFifteenData(
                        previousDate,
                        this.covid19Severities[severity].shortLabel
                    );
                    const data = {
                        startDate: previousDate,
                        endDate: currentDate,
                        startData: weeklyData,
                        endData: fifteenData,
                        severity: severity,
                        dateRange: queryParams.dateRange,
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
