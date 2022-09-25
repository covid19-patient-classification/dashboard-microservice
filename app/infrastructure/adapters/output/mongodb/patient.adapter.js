const PatientOutputPort = require('../../../../application/ports/patient.port');

class PatientMongoDBAdapter extends PatientOutputPort {
  getAllData() {
    return {
      message: "Get all data",
      status_code: 200
    }
  }
}

module.exports = PatientMongoDBAdapter;
