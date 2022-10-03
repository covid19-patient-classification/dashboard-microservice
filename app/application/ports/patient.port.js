/* eslint-disable no-unused-vars */

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
}

module.exports = PatientOutputPort;
