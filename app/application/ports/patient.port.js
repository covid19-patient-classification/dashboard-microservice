class PatientOutputPort {
  constructor() {
    if (this.constructor === PatientOutputPort) {
      throw new Error('Class "PatientOutputPort" cannot be instantiated');
    }
  }

  getAllData() {
    throw new Error('Method "getAllData()" must be implemented');
  }
}

module.exports = PatientOutputPort;
