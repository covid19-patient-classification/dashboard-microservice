/* eslint-disable no-unused-vars */

const config = require('../../infrastructure/resources/config');
const dateFormat = require('date-and-time');
const es = require('date-and-time/locale/es');
const lodash = require('lodash');
const formatParsed = 'D/M/YYYY, H:mm:ss';

dateFormat.locale(es);
class PatientOutputPort {
    constructor() {
        if (this.constructor === PatientOutputPort) {
            throw new Error('Class "PatientOutputPort" cannot be instantiated');
        }
        this.severityKeywords = {
            moderate: {
                shortLabel: 'Moderado',
                largeLabel: 'Pacientes Moderados',
            },
            serius: { shortLabel: 'Grave', largeLabel: 'Pacientes Graves' },
            critical: {
                shortLabel: 'Crítico',
                largeLabel: 'Pacientes Críticos',
            },
        };
        this.percentageLabels = {
            lastSevenDays: 'desde la semana pasada',
            lastWeek: 'de la semana actual',
            lastMonth: 'desde el mes anterior',
            default: 'desde la semana pasada',
        };
    }

    list() {
        throw new Error('Method "list()" must be implemented');
    }

    getByDate(date) {
        throw new Error('Method "getByDate()" must be implemented');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    setDateFormat(date, format) {
        const dateParsed = dateFormat.parse(date, formatParsed);
        return dateFormat.format(dateParsed, format);
    }

    setLocalTimeZone(date, format) {
        const localeDate = date.toLocaleString(config.dateLocale, {
            timeZone: config.timeZone,
        });
        return this.setDateFormat(localeDate, format);
    }

    dateToString(date, format) {
        date = this.setLocalTimeZone(date, format);
        return this.capitalize(date.replace('.', ''));
    }

    getCurrentDate() {
        return new Date();
    }

    getFirstDateOfYear() {
        return new Date(`01/01/${new Date().getFullYear()}`);
    }

    getFirstDateOfPreviousYear() {
        return new Date(`01/01/${new Date().getFullYear() - 1}`);
    }

    getLastDateOfPreviousYear() {
        return new Date(`12/31/${new Date().getFullYear() - 1}`);
    }

    getPreviousPeriod(currentDate, variation) {
        return new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - variation
        );
    }

    getDatesByFormat(data, format) {
        const dates = [];
        data.map((patient) => {
            let date = this.dateToString(patient.created_at, format);
            dates.push(date);
        });
        const weeklyDates = Array.from(new Set(dates));
        return weeklyDates;
    }

    listPatientSeverityByDate(data, dates, format) {
        const countPatients = {
            moderate: { data: [], total: 0 },
            serius: { data: [], total: 0 },
            critical: { data: [], total: 0 },
        };

        dates.map((date) => {
            let numberOfModeratePatients = 0;
            let numberOfSeriusPatients = 0;
            let numberOfCriticalPatients = 0;
            data.map((patient) => {
                let currentDate = this.dateToString(patient.created_at, format);
                if (currentDate === date) {
                    if (patient.covid19_severity.toLowerCase() === 'moderado') {
                        numberOfModeratePatients++;
                    }
                    if (patient.covid19_severity.toLowerCase() === 'grave') {
                        numberOfSeriusPatients++;
                    }
                    if (patient.covid19_severity.toLowerCase() === 'crítico') {
                        numberOfCriticalPatients++;
                    }
                }
            });
            countPatients.moderate.data.push(numberOfModeratePatients);
            countPatients.serius.data.push(numberOfSeriusPatients);
            countPatients.critical.data.push(numberOfCriticalPatients);
        });
        countPatients.moderate.total = lodash.sum(countPatients.moderate.data);
        countPatients.serius.total = lodash.sum(countPatients.serius.data);
        countPatients.critical.total = lodash.sum(countPatients.critical.data);

        return countPatients;
    }

    getPercentageDifference(totalCurrentPeriod, totalPreviousPeriod) {
        if (totalPreviousPeriod === 0) {
            return totalCurrentPeriod * 100;
        }

        return (
            ((totalCurrentPeriod - totalPreviousPeriod) / totalPreviousPeriod) *
            100
        );
    }

    getLastSevenDates() {
        const currentDate = this.getCurrentDate();
        const weeklyVariation = 7;
        const previousDate = this.getPreviousPeriod(
            currentDate,
            weeklyVariation
        );
        return { previousDate, currentDate };
    }

    async setInitialData(data) {
        const weeKlyFormat = 'DD MMM';
        const weeklyDates = this.getDatesByFormat(
            data.weeklyData,
            weeKlyFormat
        );
        const countWeeklyPatients = this.listPatientSeverityByDate(
            data.weeklyData,
            weeklyDates,
            weeKlyFormat
        );

        // Data from 15 days ago
        const fifteenDates = this.getDatesByFormat(
            data.fifteenData,
            weeKlyFormat
        );
        const countFifteenPatients = this.listPatientSeverityByDate(
            data.fifteenData,
            fifteenDates,
            weeKlyFormat
        );

        // Data from all year
        const annualFormat = 'MMMM';
        const annualDates = this.getDatesByFormat(
            data.annualData,
            annualFormat
        );
        const countAnnualPatients = this.listPatientSeverityByDate(
            data.annualData,
            annualDates,
            annualFormat
        );
        const totalAnnualPtients =
            countAnnualPatients.moderate.total +
            countAnnualPatients.serius.total +
            countAnnualPatients.critical.total;

        return {
            weekly_ranking: {
                start_date: this.setLocalTimeZone(data.previousDate, 'MM/DD/YYYY'),
                end_date: this.setLocalTimeZone(data.currentDate, 'MM/DD/YYYY'),
                labels: weeklyDates,
                data: {
                    moderate_patients: {
                        label: this.severityKeywords.moderate.largeLabel,
                        data: countWeeklyPatients.moderate.data,
                        total: countWeeklyPatients.moderate.total,
                        percentage: this.getPercentageDifference(
                            countWeeklyPatients.moderate.total,
                            countFifteenPatients.moderate.total
                        ),
                        percentage_label: this.percentageLabels.default,
                    },
                    serius_patients: {
                        label: this.severityKeywords.serius.largeLabel,
                        data: countWeeklyPatients.serius.data,
                        total: countWeeklyPatients.serius.total,
                        percentage: this.getPercentageDifference(
                            countWeeklyPatients.serius.total,
                            countFifteenPatients.serius.total
                        ),
                        percentage_label: this.percentageLabels.default,
                    },
                    critical_patients: {
                        label: this.severityKeywords.critical.largeLabel,
                        data: countWeeklyPatients.critical.data,
                        total: countWeeklyPatients.critical.total,
                        percentage: this.getPercentageDifference(
                            countWeeklyPatients.critical.total,
                            countFifteenPatients.critical.total
                        ),
                        percentage_label: this.percentageLabels.default,
                    },
                },
            },
            annual_ranking: {
                labels: annualDates,
                data: {
                    moderate_patients: {
                        label: this.severityKeywords.moderate.largeLabel,
                        data: countAnnualPatients.moderate.data,
                    },
                    serius_patients: {
                        label: this.severityKeywords.serius.largeLabel,
                        data: countAnnualPatients.serius.data,
                    },
                    critical_patients: {
                        label: this.severityKeywords.critical.largeLabel,
                        data: countAnnualPatients.critical.data,
                    },
                },
                total: totalAnnualPtients,
                total_percentage: this.getPercentageDifference(
                    totalAnnualPtients,
                    data.totalPatientsOfPreviousYear
                ),
            },
            total_ranking: {
                data: {
                    moderate_patients: {
                        label: this.severityKeywords.moderate.largeLabel,
                        total: data.totalModeratePatients,
                    },
                    serius_patients: {
                        label: this.severityKeywords.serius.largeLabel,
                        total: data.totalSeriusPatients,
                    },
                    critical_patients: {
                        label: this.severityKeywords.critical.largeLabel,
                        total: data.totalCriticalPatients,
                    },
                },
                total:
                    data.totalModeratePatients +
                    data.totalSeriusPatients +
                    data.totalCriticalPatients,
            },
            summary: { patients: data.summaryData },
        };
    }

    async setCardRanking(data) {
        return {
            start_date: this.setLocalTimeZone(data.startDate, 'MM/DD/YYYY'),
            end_date: this.setLocalTimeZone(data.endDate, 'MM/DD/YYYY'),
            data: {
                patients: {
                    label: this.severityKeywords[data.severity].largeLabel,
                    total: data.startData.length,
                    percentage: this.getPercentageDifference(
                        data.startData.length,
                        data.endData.length
                    ),
                    percentage_label: this.percentageLabels[data.dateRange],
                },
            },
        };
    }
}

module.exports = PatientOutputPort;
