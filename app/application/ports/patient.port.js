/* eslint-disable no-unused-vars */

const config = require('../../infrastructure/resources/config');
const dateFormat = require('date-and-time');
dateFormat.locale(config.dateLocale);

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

    getPreviousPeriod(currentDate, variation) {
        return new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - variation
        );
    }

    // setDateFormat(date, formatParsed, format) {
    //     const dateParsed = dateFormat.parse(date, formatParsed);
    //     return dateFormat.format(dateParsed, format);
    // }

    setLocalTimeZone(date) {
        const formatParsed = 'D/M/YYYY HH:mm:ss';
        const localeDate = date.toLocaleString(config.dateZone, {
            timeZone: config.timeZone,
        });
        console.log(localeDate);
        // return this.setDateFormat(localeDate, formatParsed, format);
    }

    setWeeklyDate(currentDate) {
        // const format = 'DD MMM';
        // const currentDate = new Date();
        const weeklyVariation = 7
        const previousDate = this.getPreviousPeriod(currentDate, weeklyVariation);
        return previousDate;
        // return this.setLocalTimeZone(previousDate, format) + ' - Hoy';
    }

    async getWeeklyRanking(data) {
        const currentDate = new Date()
        return await {
            weekly_ranking: {
                start_date: this.setWeeklyDate(currentDate),
                end_date: currentDate,
                labels: [
                    '01 sep',
                    '02 sep',
                    '03 sep',
                    '04 sep',
                    '05 sep',
                    '06 sep',
                    '07 sep',
                ],
                values: {
                    moderate_patients: {
                        label: 'Pacientes Moderados',
                        data: [10, 7, 5, 7, 5, 5, 5],
                        total: 42,
                        percentage: 10,
                        percentage_label: 'desde la semana pasada',
                    },
                    serius_patients: {
                        label: 'Pacientes Graves',
                        data: [3, 3, 3, 5, 3, 3, 3],
                        total: 23,
                        percentage: 5,
                        percentage_label: 'desde la semana pasada',
                    },
                    critical_patients: {
                        label: 'Pacientes Críticos',
                        data: [3, 3, 3, 5, 3, 3, 3],
                        total: 20,
                        percentage: -20,
                        percentage_label: 'desde la semana pasada',
                    },
                },
            },
        };
    }
}

module.exports = PatientOutputPort;
