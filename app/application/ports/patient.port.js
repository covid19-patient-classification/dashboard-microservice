/* eslint-disable no-unused-vars */

const config = require('../../infrastructure/resources/config');
const dateFormat = require('date-and-time');
const lodash = require('lodash');
const formatParsed = 'D/M/YYYY HH:mm:ss';

dateFormat.locale(config.dateZone);
class PatientOutputPort {
    constructor() {
        if (this.constructor === PatientOutputPort) {
            throw new Error('Class "PatientOutputPort" cannot be instantiated');
        }
    }

    list() {
        throw new Error('Method "list()" must be implemented');
    }

    getByDate(date) {
        throw new Error('Method "getByDate()" must be implemented');
    }

    setDateFormat(date, format) {
        const dateParsed = dateFormat.parse(date, formatParsed);
        return dateFormat.format(dateParsed, format);
    }

    setLocalTimeZone(date, format) {
        const localeDate = date.toLocaleString(config.dateZone, {
            timeZone: config.timeZone,
        });
        return this.setDateFormat(localeDate, format);
    }

    getCurrentDate() {
        return new Date();
    }

    getPreviousPeriod(currentDate, variation) {
        return new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - variation
        );
    }

    getWeeklyDates(data, format) {
        const dates = [];
        data.map((patient) => {
            let date = this.setLocalTimeZone(patient.created_at, format);
            dates.push(date);
        });
        const weeklyDates = Array.from(new Set(dates)).sort();
        return weeklyDates;
    }

    listPatientSeverityByDate(data, dates, format) {
        const countPatients = {
            moderate: [],
            serius: [],
            critical: [],
        };

        dates.map((date) => {
            let numberOfModeratePatients = 0;
            let numberOfSeriusPatients = 0;
            let numberOfCriticalPatients = 0;
            data.map((patient) => {
                let currentDate = this.setLocalTimeZone(
                    patient.created_at,
                    format
                );
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
            countPatients.moderate.push(numberOfModeratePatients);
            countPatients.serius.push(numberOfSeriusPatients);
            countPatients.critical.push(numberOfCriticalPatients);
        });

        return countPatients;
    }

    getPercentageDifference(arrayCurrentValues, arrayLastValues) {
        if (lodash.sum(arrayLastValues) === 0) {
            return lodash.sum(arrayCurrentValues) * 100;
        }

        return (
            (lodash.sum(arrayCurrentValues) * 100) /
                lodash.sum(arrayLastValues) -
            100
        );
    }

    async getInitialData(startDate, endDate, weeKlyData, fifteenData) {
        const weeKlyFormat = 'DD MMM';
        const weeklyDates = this.getWeeklyDates(weeKlyData, weeKlyFormat);
        const countWeeklyPatients = this.listPatientSeverityByDate(
            weeKlyData,
            weeklyDates,
            weeKlyFormat
        );

        // Data from 15 days ago
        const fifteenDates = this.getWeeklyDates(fifteenData, weeKlyFormat);
        const countFifteenPatients = this.listPatientSeverityByDate(
            fifteenData,
            fifteenDates,
            weeKlyFormat
        );

        return await {
            weekly_ranking: {
                start_date: startDate,
                end_date: endDate,
                labels: weeklyDates,
                values: {
                    moderate_patients: {
                        label: 'Pacientes Moderados',
                        data: countWeeklyPatients.moderate,
                        total: lodash.sum(countWeeklyPatients.moderate),
                        percentage: this.getPercentageDifference(
                            countWeeklyPatients.moderate,
                            countFifteenPatients.moderate
                        ),
                        percentage_label: 'desde la semana pasada',
                    },
                    serius_patients: {
                        label: 'Pacientes Graves',
                        data: countWeeklyPatients.serius,
                        total: lodash.sum(countWeeklyPatients.serius),
                        percentage: this.getPercentageDifference(
                            countWeeklyPatients.serius,
                            countFifteenPatients.serius
                        ),
                        percentage_label: 'desde la semana pasada',
                    },
                    critical_patients: {
                        label: 'Pacientes Críticos',
                        data: countWeeklyPatients.critical,
                        total: lodash.sum(countWeeklyPatients.critical),
                        percentage: this.getPercentageDifference(
                            countWeeklyPatients.critical,
                            countFifteenPatients.critical
                        ),
                        percentage_label: 'desde la semana pasada',
                    },
                },
            },
        };
    }
}

module.exports = PatientOutputPort;
