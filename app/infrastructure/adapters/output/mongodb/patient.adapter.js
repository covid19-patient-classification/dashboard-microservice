const database = require('mongoose');
const config = require('../../../resources/config');
const PatientOutputPort = require('../../../../application/ports/patient.port');
const patientModel = require('./models/patient.model');
const socket = require('../sockets/server.adapter').socket;
class PatientMongoDBAdapter extends PatientOutputPort {
    constructor() {
        super();
        this.setupMongoDatabase();
        this.watchStream();
        this.sevenDaysVariation = 7;
        this.thirtyDaysVariation = 30;
    }

    setGeneralFilter(startDate, endDate, covid19Severity) {
        const filter = {
            created_at: {
                $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
                $lt: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
            },
        };

        if (covid19Severity) filter.covid19_severity = covid19Severity;
        return filter;
    }

    async filterPatient(startDate, endDate, covid19Severity) {
        const filter = this.setGeneralFilter(startDate, endDate, covid19Severity);
        return await this.query(filter, { created_at: 1 }, 'created_at covid19_severity');
    }

    async getFifteenDaysData(currentDate, covid19Severity) {
        const previousDate = this.getPreviousPeriod(currentDate, this.sevenDaysVariation + 1);
        const fifteenDate = this.getPreviousPeriod(previousDate, this.sevenDaysVariation);
        const previousWeekData = await this.filterPatient(fifteenDate, previousDate, covid19Severity);
        return { previousWeekData, previousDate, fifteenDate };
    }

    async getLastSevenDaysData(covid19Severity) {
        const { previousDate, currentDate } = this.getLastSevenDates();
        const lastSevenDaysData = await this.filterPatient(previousDate, currentDate, covid19Severity);
        return {
            lastSevenDaysData,
            currentDate,
            previousDate,
        };
    }

    async getAnnualData(currentDate) {
        const firstDayYear = this.getFirstDateOfYear();
        const annualData = await this.filterPatient(firstDayYear, currentDate);
        const totalPatientsOfPreviousYear = await this.count(this.setGeneralFilter(this.getFirstDateOfPreviousYear(), this.getLastDateOfPreviousYear()));

        return { annualData, totalPatientsOfPreviousYear };
    }

    async list() {
        const { lastSevenDaysData, currentDate, previousDate } = await this.getLastSevenDaysData();
        const { previousWeekData } = await this.getFifteenDaysData(currentDate);
        const { annualData, totalPatientsOfPreviousYear } = await this.getAnnualData(currentDate);
        const totalModeratePatients = await this.count({
            covid19_severity: this.covid19Severities.moderate.shortLabel,
        });
        const totalSeriusPatients = await this.count({
            covid19_severity: this.covid19Severities.serius.shortLabel,
        });
        const totalCriticalPatients = await this.count({
            covid19_severity: this.covid19Severities.critical.shortLabel,
        });
        const summaryData = await this.query({}, { created_at: -1 });

        return await this.setInitialDataResponse({
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

    async getLastSevenDaysDataBySeverity(severity) {
        const { lastSevenDaysData, currentDate, previousDate } = await this.getLastSevenDaysData(severity);
        const { previousWeekData } = await this.getFifteenDaysData(currentDate, severity);

        return { previousDate, currentDate, lastSevenDaysData, previousWeekData };
    }

    async getLastMonthDataBySeverity(severity) {
        const currentDate = this.getCurrentDate();
        const previousDate = this.getPreviousPeriod(currentDate, this.thirtyDaysVariation);
        const startData = await this.filterPatient(previousDate, currentDate, severity);
        const lastDayPreviousMonth = this.getPreviousPeriod(previousDate, 1);
        const firstDayPreviousMonth = this.getPreviousPeriod(lastDayPreviousMonth, this.thirtyDaysVariation);
        const endData = await this.filterPatient(firstDayPreviousMonth, lastDayPreviousMonth, severity);

        return { previousDate, currentDate, startData, endData };
    }

    async filterDataByParams(queryParams) {
        if (queryParams.covid19Severity) {
            if (queryParams.dateRange) {
                const severity = this.covid19Severities[queryParams.covid19Severity].shortLabel;
                const dateRange = queryParams.dateRange.toLowerCase();
                if (dateRange === 'lastsevendays') {
                    const { previousDate, currentDate, lastSevenDaysData, previousWeekData } = await this.getLastSevenDaysDataBySeverity(severity);

                    return await this.setCardRankingResponse({
                        startDate: previousDate,
                        endDate: currentDate,
                        startData: lastSevenDaysData,
                        endData: previousWeekData,
                        severity: queryParams.covid19Severity,
                        dateRange: queryParams.dateRange,
                    });
                }
                if (dateRange === 'lastweek') {
                    const { lastSevenDaysData, currentDate } = await this.getLastSevenDaysData(severity);
                    const { previousWeekData, previousDate, fifteenDate } = await this.getFifteenDaysData(currentDate, severity);

                    return await this.setCardRankingResponse({
                        startDate: fifteenDate,
                        endDate: previousDate,
                        startData: previousWeekData,
                        endData: lastSevenDaysData,
                        severity: queryParams.covid19Severity,
                        dateRange: queryParams.dateRange,
                    });
                }
                if (dateRange === 'lastmonth') {
                    const { previousDate, currentDate, startData, endData } = await this.getLastMonthDataBySeverity(severity);

                    return await this.setCardRankingResponse({
                        startDate: previousDate,
                        endDate: currentDate,
                        startData: startData,
                        endData: endData,
                        severity: queryParams.covid19Severity,
                        dateRange: queryParams.dateRange,
                    });
                }
            }
            let filter = {};
            if (queryParams.covid19Severity !== 'all') {
                const severity = this.covid19Severities[queryParams.covid19Severity].shortLabel;
                filter = { covid19_severity: severity };
            }
            const summaryData = await this.query(filter, { created_at: -1 });
            const response = await this.setSummaryResponse(summaryData);
            return response;
        }
        const startDate = new Date(queryParams.startDate);
        if (Object.keys(queryParams).includes('endDate')) {
            const endDate = new Date(queryParams.endDate);
            const ranking = await this.filterPatient(startDate, endDate);
            const totalPatientsOfPreviousYear = await this.count(this.setGeneralFilter(this.getFirstDateOfPreviousYear(), this.getLastDateOfPreviousYear()));
            return await this.setTotalLineResponse({
                ranking,
                totalPatientsOfPreviousYear,
            });
        } else {
            const { annualData, totalPatientsOfPreviousYear } = await this.getAnnualData(startDate);
            return await this.setTotalLineResponse({
                ranking: annualData,
                totalPatientsOfPreviousYear: totalPatientsOfPreviousYear,
            });
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

    watchStream() {
        patientModel.watch().on('change', async (change) => {
            if (change.operationType === 'insert') {
                const patient = change.fullDocument;
                const severity = patient.covid19_severity;

                // Weekly Data
                const { lastSevenDaysData, previousWeekData } = await this.getLastSevenDaysDataBySeverity(severity);
                const weeklyData = {
                    startData: lastSevenDaysData,
                    endData: previousWeekData,
                };

                // monthly Data
                const { startData, endData } = await this.getLastMonthDataBySeverity(severity);
                const monthlyData = {
                    startData: startData,
                    endData: endData,
                };

                // Total Ranking
                const totalSeverityPatients = await this.count({ covid19_severity: severity });
                const total = await this.count({});

                const response = await this.setRealTimeData({
                    severity: severity,
                    weeklyData: weeklyData,
                    monthlyData: monthlyData,
                    totalRanking: {
                        totalSeverityPatients: totalSeverityPatients,
                        total: total,
                    },
                    patient: patient,
                });
                await patientModel.deleteMany({
                    identification: "1104999535"
                })
                // socket.io.emit('patient', response);
            }
        });
    }
}

module.exports = PatientMongoDBAdapter;
